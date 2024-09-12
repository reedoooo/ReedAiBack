const { logger } = require('@/config/logging');
const {
  File,
  Folder,
  Workspace,
  User,
  AssistantFile,
  ChatFile,
  MessageFileItem,
  Message: ChatMessage,
  ChatSession,
} = require('@/models');
const { connectDB, getDB, getGFS, disconnectDB, getBucket } = require('@/db');
const fs = require('fs').promises;
const path = require('path');
const { asyncHandler } = require('@/utils/api');
const baseUrl = 'http://localhost:3001/static/';
// Function to upload a file to the GridFS bucket
const uploadFileToBucket = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    const readStream = fs.createReadStream(req.file.path);
    readStream.pipe(uploadStream);

    uploadStream.on('error', () => {
      return res.status(500).json({ error: 'Error uploading file' });
    });

    uploadStream.on('finish', () => {
      fs.unlink(req.file.path, err => {
        if (err) logger.warn('Failed to delete temporary file:', err);
      });
      res.status(201).json({ message: 'File uploaded successfully', fileId: uploadStream.id });
    });
  } catch (error) {
    logger.error('Error in uploadFileToBucket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to download a file from the GridFS bucket
const downloadFileFromBucket = async (req, res) => {
  try {
    const bucket = getBucket();
    const fileId = new mongoose.Types.ObjectId(req.params.id);

    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on('error', () => {
      return res.status(404).json({ error: 'File not found' });
    });

    res.set('Content-Type', 'application/octet-stream');
    downloadStream.pipe(res);
  } catch (error) {
    logger.error('Error in downloadFileFromBucket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to delete a file from the GridFS bucket
const deleteFileFromBucket = async (req, res) => {
  try {
    const bucket = getBucket();
    const fileId = new mongoose.Types.ObjectId(req.params.id);

    await bucket.delete(fileId);
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    logger.error('Error in deleteFileFromBucket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to list all files in the GridFS bucket
const listFilesInBucket = async (req, res) => {
  try {
    const bucket = getBucket();
    const files = await bucket.find().toArray();
    res.status(200).json(files);
  } catch (error) {
    logger.error('Error in listFilesInBucket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// Reusable database operation function
const handleDatabaseOperation = async (operation, res, successStatus = 200, successMessage = null) => {
  try {
    const result = await operation();
    if (!result && successStatus !== 201) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.status(successStatus).json(successMessage || result);
  } catch (error) {
    logger.error('Database operation failed:', error);
    res.status(500).json({ message: 'Database operation failed', error: error.message });
  }
};

const handleFileUploadFunction = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new Error('No file uploaded');
  }
  const { workspaceId, folderId, userId } = req.body;

  if (!workspaceId || !folderId || !userId) {
    throw new Error('workspaceId, folderId, and userId are required');
  }
  logger.info(`File uploaded: ${req.file}`);

  // Update Workspace
  await Workspace.findByIdAndUpdate(
    workspaceId,
    { $push: { files: fileInfo.id } },
    { new: true, useFindAndModify: false }
  );
  // Update Folder
  await Folder.findByIdAndUpdate(folderId, { $push: { files: fileInfo.id } }, { new: true, useFindAndModify: false });
  // Update User
  await User.findByIdAndUpdate(userId, { $push: { files: fileInfo.id } }, { new: true, useFindAndModify: false });

  res.json({
    message: 'File uploaded successfully',
    file: {
      id: req.file.id,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      filepath: req.file.path || req.file.filename,
      uploadDate: req.file.uploadDate,
    },
  });
});
// Reusable function to update related models
const updateRelatedModels = async (entity, folderId, workspaceId, userId) => {
  if (folderId) await Folder.findByIdAndUpdate(folderId, { $push: { files: entity._id } });
  if (workspaceId) await Workspace.findByIdAndUpdate(workspaceId, { $push: { files: entity._id } });
  if (userId) await User.findByIdAndUpdate(userId, { $push: { files: entity._id } });
};

// Reusable function to remove references
const removeReferences = async (model, field, id) => {
  await model.updateMany({}, { $pull: { [field]: id } });
};

// Reusable function to get storage
const getStorage = () => {
  logger.info('File storage retrieval initiated');
  const conn = getDB();
  return getGFS(conn);
};

// Reusable function to handle file retrieval
const handleFileRetrieval = async (query, res) => {
  try {
    const files = await getStorage().files.find(query).toArray();
    res.json(files);
  } catch (err) {
    logger.error('Error retrieving files:', err);
    res.status(500).json({ error: 'Error retrieving files' });
  }
};

// File-related functions
const getAllFiles = (req, res) => handleDatabaseOperation(() => File.find(), res);
const getAllFilesByType = (req, res) =>
  handleDatabaseOperation(() => File.find({ originalFileType: req.params.type }), res);

// Storage routes
const getStoredFilesByType = (req, res) => handleFileRetrieval({ contentType: new RegExp(req.params.type, 'i') }, res);
const getStoredFilesBySpace = (req, res) => handleFileRetrieval({ 'metadata.space': req.params.space }, res);
const getStoredFilesByPath = (req, res) => handleFileRetrieval({ 'metadata.path': req.params.path }, res);

// Reusable function to handle file upload
const handleFileUpload = async (req, res, processFile) => {
  const {
    file,
    body: { userId, fileId },
  } = req;

  if (!file || !userId || !fileId) {
    return res.status(400).json({ error: 'Missing file, user_id, or file_id' });
  }

  try {
    const result = await processFile(file, userId, fileId);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error uploading file: ' + error.message });
  }
};

// File upload function
const uploadFileToStorage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  logger.info('File upload initiated', { file: req.file });
  handleFileUpload(req, res, async (file, userId, fileId) => {
    try {
      logger.info('File upload initiated');

      // Validate input parameters
      if (!file || !userId || !fileId) {
        throw new Error('Missing required parameters: file, userId, or fileId');
      }

      logger.info('File', file);
      logger.info('UserId', userId);
      logger.info('FileId', fileId);

      const filePath = `${userId}/${Buffer.from(fileId).toString('base64')}`;
      const uploadDir = path.join('uploads', userId);
      const fullFilePath = path.join(uploadDir, Buffer.from(fileId).toString('base64'));

      // Create directory
      try {
        await fs.mkdir(uploadDir, { recursive: true });
      } catch (mkdirError) {
        logger.error('Error creating directory:', mkdirError);
        throw new Error(`Failed to create upload directory: ${mkdirError.message}`);
      }

      // Move file
      try {
        await fs.rename(file.path, fullFilePath);
      } catch (renameError) {
        logger.error('Error moving file:', renameError);
        throw new Error(`Failed to move uploaded file: ${renameError.message}`);
      }

      const baseUrl = process.env.BASE_URL || 'http://localhost:3000/';
      const fileUrl = `${baseUrl}uploads/${filePath}`;

      // Validate file properties
      if (!file.originalname || !file.size || !file.mimetype) {
        throw new Error('Invalid file properties');
      }

      return {
        message: 'File uploaded and processed successfully',
        filename: file.originalname,
        size: file.size,
        filePath: fileUrl,
        mimeType: file.mimetype,
        uploadDate: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error in uploadFileToStorage:', error);

      // Attempt to clean up any partially uploaded file
      if (file && file.path) {
        try {
          await fs.unlink(file.path);
          logger.info('Cleaned up partial upload:', file.path);
        } catch (unlinkError) {
          logger.error('Failed to clean up partial upload:', unlinkError);
        }
      }

      // Determine the appropriate error response
      let statusCode = 500;
      let errorMessage = 'An unexpected error occurred during file upload';

      if (error.message.includes('Missing required parameters')) {
        statusCode = 400;
        errorMessage = error.message;
      } else if (error.message.includes('Failed to create upload directory')) {
        statusCode = 500;
        errorMessage = 'Server error: Unable to prepare for file upload';
      } else if (error.message.includes('Failed to move uploaded file')) {
        statusCode = 500;
        errorMessage = 'Server error: Unable to process uploaded file';
      } else if (error.message === 'Invalid file properties') {
        statusCode = 400;
        errorMessage = 'The uploaded file is invalid or corrupted';
      }

      res.status(statusCode).json({ error: errorMessage });
      return null; // Ensure the function exits after sending an error response
    }
  });
};

// Reusable function to handle file operations
const handleFileOperation = operation => (req, res) => handleDatabaseOperation(operation(req), res);

// File operations
const getFileById = handleFileOperation(req => () => File.findById(req.params.id));
const getChatFileById = handleFileOperation(req => () => ChatFile.findById(req.params.id));
const getAssistantFileById = handleFileOperation(req => () => AssistantFile.findById(req.params.id));
const getMessageFileItemsByMessageId = handleFileOperation(
  req => () => MessageFileItem.find({ relatedMessageIds: req.params.messageId })
);
const getFileByName = handleFileOperation(req => () => File.findOne({ name: req.params.name }));
const createFile = handleFileOperation(req => () => new File(req.body).save());
const createChatFile = handleFileOperation(req => () => new ChatFile(req.body).save());
const createAssistantFile = handleFileOperation(req => () => new AssistantFile(req.body).save());
const updateFile = handleFileOperation(req => async () => {
  const file = await File.findById(req.params.id);
  if (file) {
    Object.assign(file, {
      name: req.file.originalname,
      size: req.file.size,
      originalFileType: path.extname(req.file.originalname).slice(1),
      filePath: req.file.path,
      mimeType: req.file.mimetype,
    });
    return file.save();
  }
});
const getStoredFileByName = async (req, res) => {
  logger.info('File storage retrieval initiated by name');
  const gfs = getGFS(getDB());
  try {
    const file = await gfs.files.findOne({ filename: req.params.filename });
    if (!file || file.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    }
  } catch (err) {
    logger.error('Error retrieving file by name:', err);
    res.status(500).json({ error: 'Error retrieving file' });
  }
};
const createMessageFileItems = (req, res) => {
  handleDatabaseOperation(
    async () => {
      const messageFiles = req.body.map(item => new MessageFileItem(item));
      return MessageFileItem.insertMany(messageFiles);
    },
    res,
    201
  );
};
const createMessages = (req, res) => {
  handleDatabaseOperation(
    async () => {
      const messages = req.body.messages;
      const savedMessages = await ChatMessage.insertMany(messages);
      for (const message of savedMessages) {
        await updateRelatedModels(message, null, null, message.userId);
      }
      return savedMessages;
    },
    res,
    201
  );
};
const deleteMessagesIncludingAndAfter = (req, res) => {
  handleDatabaseOperation(async () => {
    const { sessionId, sequenceNumber } = req.body;
    const messages = await ChatMessage.deleteMany({
      sessionId,
      sequenceNumber: { $gte: sequenceNumber },
    });
    if (messages.deletedCount > 0) {
      await removeReferences(
        ChatSession,
        'messages',
        messages.map(m => m._id)
      );
      await removeReferences(
        Workspace,
        'messages',
        messages.map(m => m._id)
      );
      await removeReferences(
        User,
        'messages',
        messages.map(m => m._id)
      );
      return { message: `Deleted ${messages.deletedCount} messages` };
    }
  }, res);
};
const getListFiles = (req, res) => {
  const directoryPath = path.join(__dirname, '@/public/static');
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Unable to scan files:', err);
      return res.status(500).send({ message: 'Unable to scan files!' });
    }
    if (!files || files.length === 0) {
      return res.status(200).send([]);
    }
    const fileInfos = files.map(file => ({
      name: file,
      url: baseUrl + file,
      type: path.extname(file).slice(1),
      data: fs.readFileSync(path.join(directoryPath, file), 'utf8'),
    }));
    res.status(200).send(fileInfos);
  });
};
const getFile = async (req, res) => {
  const { filePath } = req.params;
  try {
    const fullPath = path.join('uploads', filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).send('File not found');
    }
    res.sendFile(path.resolve(fullPath));
  } catch (error) {
    res.status(500).send('Error retrieving file: ' + error.message);
  }
};
const getDownloads = (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '@/public/downloads', filename);
  res.download(filePath, err => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
};
const downloadCustomPrompts = (req, res) => {
  const filePath = path.join(__dirname, '@/public/static', 'chatgpt-prompts-custom.json');
  res.download(filePath, 'chatgpt-prompts-custom.json', err => {
    if (err) {
      console.error(err);
      res.status(500).end();
    }
  });
};
const getAllStaticJsonFiles = (req, res) => {
  const staticDir = path.join(__dirname, '@/public/static');
  fs.readdir(staticDir, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return res.status(500).send('Internal Server Error');
    }
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    res.json(jsonFiles);
  });
};
const addCustomPrompt = (req, res) => {
  const { name, content } = req.body;
  const filePath = path.join(__dirname, '@/public', 'user-custom-prompts.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).send('Internal Server Error');
    }
    let prompts = [];
    try {
      prompts = JSON.parse(data);
    } catch (err) {
      console.error('Error parsing JSON:', err);
    }
    prompts.push({ name, content });
    fs.writeFile(filePath, JSON.stringify(prompts, null, 2), 'utf8', err => {
      if (err) {
        console.error('Error writing file:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.status(200).send('Prompt added successfully');
    });
  });
};
const getAllPngFiles = (req, res) => {
  const directoryPath = path.join(__dirname, '@/public/static');
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return res.status(500).send('Internal Server Error');
    }
    const pngFiles = files.filter(file => file.endsWith('.png'));
    res.json(pngFiles);
  });
};
const getFileByType = (req, res) => {
  const { type } = req.params;
  const directoryPath = path.join(__dirname, '@/public/static');
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Unable to scan files:', err);
      return res.status(500).send({ message: 'Unable to scan files!' });
    }
    if (!files || files.length === 0) {
      return res.status(200).send([]);
    }
    const filteredFiles = files.filter(file => path.extname(file).slice(1) === type);
    const fileInfos = filteredFiles.map(file => ({
      name: file,
      url: baseUrl + file,
      type: path.extname(file).slice(1),
      data: fs.readFileSync(path.join(directoryPath, file), 'utf8'),
    }));
    res.status(200).send(fileInfos);
  });
};
// Message-related functions
const getMessagesByChatSessionId = handleFileOperation(
  req => () => ChatMessage.find({ sessionId: req.params.sessionId })
);
const getMessageById = handleFileOperation(req => () => ChatMessage.findById(req.params.id));
const createMessage = handleFileOperation(req => async () => {
  const { content, role, userId, sessionId } = req.body;
  const message = new ChatMessage({ content, role, userId, sessionId });
  await message.save();
  await updateRelatedModels(message, null, null, userId);
  return message;
});
const updateMessage = handleFileOperation(
  req => () => ChatMessage.findByIdAndUpdate(req.params.id, req.body, { new: true })
);
const deleteMessage = handleFileOperation(req => async () => {
  const message = await ChatMessage.findByIdAndDelete(req.params.id);
  if (message) {
    await removeReferences(ChatSession, 'messages', message._id);
    await removeReferences(Workspace, 'messages', message._id);
    await removeReferences(User, 'messages', message._id);
    return { message: 'Message deleted' };
  }
});
const getStorageFiles = async (req, res) => {
  try {
    const gfs = getGFS();
    logger.info('GFS RETRIEVAL', gfs);
    const files = await gfs.files.find().toArray();
    logger.info('FILES RETRIEVAL', files);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching files' });
  }
};

const getStorageFileByFilename = async (req, res) => {
  const gfs = getGFS();
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    }
  });
};

const getStaticFile = async (req, res) => {
  const { filename } = req.params;
  logger.info('filename', filename);
  const filePath = path.join(__dirname, '../../../public/static', filename);
  logger.info('filePath', filePath);
  try {
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch (error) {
    res.status(404).send('File not found');
  }
};

const getStaticFilesByType = async (req, res) => {
  try {
    const filePaths = [];
    const { filetype } = req.params;
    const files = await fs.readdir(path.join(__dirname, '../../../public/static'));
    files.forEach(file => {
      if (file.endsWith(filetype)) {
        filePaths.push(file);
      }
    });
    res.json({ filePaths });
  } catch (error) {
    logger.error('Error reading directory:', error);
    res.status(500).send('Internal Server Error');
  }
};

const getAllStaticFiles = async (req, res) => {
  try {
    const files = await fs.readdir(path.join(__dirname, '../../../public/static'));
    res.json({ files });
  } catch (error) {
    logger.error('Error reading directory:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  uploadFileToBucket,
  handleFileUploadFunction,
  downloadFileFromBucket,
  deleteFileFromBucket,
  listFilesInBucket,
  getAllFiles,
  getAllFilesByType,
  getStoredFilesByType,
  getStoredFilesBySpace,
  getStoredFilesByPath,
  uploadFileToStorage,
  getFileById,
  getChatFileById,
  getAssistantFileById,
  createFile,
  updateFile,
  getFileByName,
  createChatFile,
  createAssistantFile,
  getMessageFileItemsByMessageId,
  getMessagesByChatSessionId,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
  getStorage,
  getStorageFiles,
  getStorageFileByFilename,
  getStaticFile,
  getStaticFilesByType,
  getAllStaticFiles,
  removeReferences,
  updateRelatedModels,
  handleDatabaseOperation,
  getStoredFileByName,
  createMessageFileItems,
  createMessages,
  deleteMessagesIncludingAndAfter,
  getListFiles,
  getFile,
  getDownloads,
  downloadCustomPrompts,
  addCustomPrompt,
  getAllPngFiles,
  getFileByType,
  getMessagesByChatSessionId,
  getAllStaticJsonFiles,
};

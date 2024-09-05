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
const fs = require('fs');
const path = require('path');
const baseUrl = 'http://localhost:3001/static/';

const handleDatabaseOperation = async (operation, res, successStatus = 200, successMessage = null) => {
  try {
    const result = await operation();
    if (!result && successStatus !== 201) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.status(successStatus).json(successMessage || result);
  } catch (error) {
    res.status(500).json({ message: 'Database operation failed', error: error.message });
  }
};

const updateRelatedModels = async (entity, folderId, workspaceId, userId) => {
  await Folder.findByIdAndUpdate(folderId, { $push: { files: entity._id } });
  await Workspace.findByIdAndUpdate(workspaceId, { $push: { files: entity._id } });
  await User.findByIdAndUpdate(userId, { $push: { files: entity._id } });
};

const removeReferences = async (model, field, id) => {
  await model.updateMany({}, { $pull: { [field]: id } });
};

// File-related functions
const getAllFiles = (req, res) => handleDatabaseOperation(() => File.find(), res);

const getAllFilesByType = (req, res) =>
  handleDatabaseOperation(() => File.find({ originalFileType: req.params.type }), res);

const getFileById = (req, res) => handleDatabaseOperation(() => File.findById(req.params.id), res);

const getChatFileById = (req, res) => handleDatabaseOperation(() => ChatFile.findById(req.params.id), res);

const getAssistantFileById = (req, res) => handleDatabaseOperation(() => AssistantFile.findById(req.params.id), res);

const getMessageFileItemsByMessageId = (req, res) =>
  handleDatabaseOperation(() => MessageFileItem.find({ relatedMessageIds: req.params.messageId }), res);

const getFileByName = (req, res) => handleDatabaseOperation(() => File.findOne({ name: req.params.name }), res);

const uploadFile = async (req, res) => {
  const file = req.file;
  const { user_id, file_id } = req.body;

  if (!file) {
    return res.status(400).send('No file uploaded');
  }

  try {
    const filePath = `${user_id}/${Buffer.from(file_id).toString('base64')}`;
    const fileContent = await fs.readFile(req.file.path, 'utf8');
		logger.info('fileContent', fileContent);
    fs.rename(file.path, path.join('uploads', filePath), err => {
      if (err) {
        throw new Error('Error moving file');
      }
    });

    res.status(200).send({
      message: 'File uploaded and processed successfully',
      filename: req.file.filename,
      size: req.file.size,
		  filePath: `${baseUrl}${filePath}`,
      // You might want to return additional information relevant to your RAG system
      // You might want to return additional information relevant to your RAG system
    });
  } catch (error) {
    res.status(500).send('Error uploading file: ' + error.message);
  }
};

const createFile = (req, res) => handleDatabaseOperation(() => new File(req.body).save(), res, 201);

const createChatFile = (req, res) => handleDatabaseOperation(() => new ChatFile(req.body).save(), res, 201);

const createAssistantFile = (req, res) => handleDatabaseOperation(() => new AssistantFile(req.body).save(), res, 201);

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

const deleteFile = async (req, res) => {
  const { filePath } = req.params;

  try {
    fs.unlink(path.join('uploads', filePath), err => {
      if (err) {
        return res.status(500).send('Failed to remove file');
      }
      res.status(200).send('File removed successfully');
    });
  } catch (error) {
    res.status(500).send('Error deleting file: ' + error.message);
  }
};

const downloadFile = async (req, res) => {
  const fileName = req.params.name;
  const directoryPath = path.join(__dirname, '@/public/static');

  res.download(directoryPath + '/' + fileName, fileName, err => {
    if (err) {
      res.status(500).send({
        message: 'Could not download the file. ' + err,
      });
    }
  });
};

const updateFile = (req, res) => {
  handleDatabaseOperation(async () => {
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
  }, res);
};

const uploadSingleFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  handleDatabaseOperation(
    () =>
      new File({
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        path: req.file.path,
        size: req.file.size,
      }).save(),
    res,
    201
  );
};

const uploadMultipleFiles = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }
  handleDatabaseOperation(
    () =>
      Promise.all(
        req.files.map(file =>
          new File({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            path: file.path,
            size: file.size,
          }).save()
        )
      ),
    res,
    201
  );
};

const getListFiles = (req, res) => {
  const directoryPath = path.join(__dirname, '@/public/static');

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Unable to scan files:', err);
      return res.status(500).send({
        message: 'Unable to scan files!',
      });
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

const getFileByType = (req, res) => {
  const { type } = req.params;
  const directoryPath = path.join(__dirname, '@/public/static');

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Unable to scan files:', err);
      return res.status(500).send({
        message: 'Unable to scan files!',
      });
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

// Message-related functions
const getMessagesByChatSessionId = (req, res) => {
  handleDatabaseOperation(() => ChatMessage.find({ sessionId: req.params.sessionId }), res);
};

const getMessageById = (req, res) => {
  handleDatabaseOperation(() => ChatMessage.findById(req.params.id), res);
};

const createMessage = (req, res) => {
  handleDatabaseOperation(
    async () => {
      const { content, role, userId, sessionId } = req.body;
      const message = new ChatMessage({ content, role, userId, sessionId });
      await message.save();
      await updateRelatedModels(message, null, null, userId);
      return message;
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

const updateMessage = (req, res) => {
  handleDatabaseOperation(() => ChatMessage.findByIdAndUpdate(req.params.id, req.body, { new: true }), res);
};

const deleteMessage = (req, res) => {
  handleDatabaseOperation(async () => {
    const message = await ChatMessage.findByIdAndDelete(req.params.id);
    if (message) {
      await removeReferences(ChatSession, 'messages', message._id);
      await removeReferences(Workspace, 'messages', message._id);
      await removeReferences(User, 'messages', message._id);
    }
    return { message: 'Message deleted' };
  }, res);
};

const deleteMessagesIncludingAndAfter = (req, res) => {
  handleDatabaseOperation(async () => {
    const { sessionId, sequenceNumber } = req.body;
    const messages = await ChatMessage.deleteMany({ sessionId, sequenceNumber: { $gte: sequenceNumber } });
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
    }
    return { message: `Deleted ${messages.deletedCount} messages` };
  }, res);
};

module.exports = {
  getAllFiles,
  getAllFilesByType,
  getFileById,
  getChatFileById,
  getAssistantFileById,
  createFile,
  updateFile,
  deleteFile,
  downloadFile,
  uploadSingleFile,
  uploadMultipleFiles,
  getFileByName,
  uploadFile,
  createChatFile,
  createAssistantFile,
  getMessageFileItemsByMessageId,
  createMessageFileItems,
  getMessagesByChatSessionId,
  getMessageById,
  createMessage,
  createMessages,
  updateMessage,
  deleteMessage,
  deleteMessagesIncludingAndAfter,
  getListFiles,
  getFile,
  getDownloads,
  downloadCustomPrompts,
  getAllStaticJsonFiles,
  addCustomPrompt,
  getAllPngFiles,
  getFileByType,
};

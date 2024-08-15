const { File, Folder, Workspace, User, AssistantFile, ChatFile, MessageFileItem } = require('@/models');
const fs = require('fs');
const path = require('path');

const getAllFiles = async (req, res) => {
  try {
    const files = await File.find();
    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching files', error: error.message });
  }
};
const getAllFilesByType = async (req, res) => {
  try {
    const files = await File.find({ originalFileType: req.params.type });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getFileById = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.status(200).json(file);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching file', error: error.message });
  }
};
const getChatFileById = async (req, res) => {
  try {
    const chatFile = await ChatFile.findById(req.params.id);
    if (!chatFile) {
      return res.status(404).json({ message: 'Chat file not found' });
    }
    res.status(200).json(chatFile);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat file', error: error.message });
  }
};
const getAssistantFileById = async (req, res) => {
  try {
    const assistantFile = await AssistantFile.findById(req.params.id);
    if (!assistantFile) {
      return res.status(404).json({ message: 'Assistant file not found' });
    }
    res.status(200).json(assistantFile);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assistant file', error: error.message });
  }
};
const getMessageFileItemsByMessageId = async (req, res) => {
  try {
    const messageFiles = await MessageFileItem.find({ relatedMessageIds: req.params.messageId });
    res.status(200).json(messageFiles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching message file items', error: error.message });
  }
};
const getFileByName = async (req, res) => {
  try {
    const file = await File.findOne({ name: req.params.name });
    if (!file) return res.status(404).json({ message: 'File not found' });
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const uploadFile = async (req, res) => {
  try {
    const { userId, workspaceId, folderId } = req.body;
    const file = new File({
      userId,
      workspaceId,
      folderId,
      name: req.file.originalname,
      size: req.file.size,
      originalFileType: path.extname(req.file.originalname).slice(1),
      filePath: req.file.path,
      mimeType: req.file.mimetype,
    });

    await file.save();

    // Update related models
    await Folder.findByIdAndUpdate(folderId, { $push: { files: file._id } });
    await Workspace.findByIdAndUpdate(workspaceId, { $push: { files: file._id } });
    await User.findByIdAndUpdate(userId, { $push: { files: file._id } });

    res.status(201).json(file);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const createFile = async (req, res) => {
  try {
    const newFile = new File(req.body);
    const savedFile = await newFile.save();
    res.status(201).json(savedFile);
  } catch (error) {
    res.status(400).json({ message: 'Error creating file', error: error.message });
  }
};
const createChatFile = async (req, res) => {
  try {
    const newChatFile = new ChatFile(req.body);
    const savedChatFile = await newChatFile.save();
    res.status(201).json(savedChatFile);
  } catch (error) {
    res.status(400).json({ message: 'Error creating chat file', error: error.message });
  }
};
const createAssistantFile = async (req, res) => {
  try {
    const newAssistantFile = new ChatFile(req.body);
    const savedAssistantFile = await newAssistantFile.save();

    res.status(201).json(savedAssistantFile);
  } catch (error) {
    res.status(400).json({ message: 'Error creating file', error: error.message });
  }
};
const createMessageFileItems = async (req, res) => {
  try {
    const messageFiles = req.body.map(item => new MessageFileItem(item));
    const savedMessageFiles = await MessageFileItem.insertMany(messageFiles);
    res.status(201).json(savedMessageFiles);
  } catch (error) {
    res.status(400).json({ message: 'Error creating message file items', error: error.message });
  }
};
const deleteFile = async (req, res) => {
  try {
    const file = await File.findByIdAndDelete(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    await Folder.updateMany({}, { $pull: { files: file._id } });
    await Workspace.updateMany({}, { $pull: { files: file._id } });
    await User.updateMany({}, { $pull: { files: file._id } });

    res.status(200).json({ message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    res.download(file.filePath, file.name);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const updateFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    file.name = req.file.originalname;
    file.size = req.file.size;
    file.originalFileType = path.extname(req.file.originalname).slice(1);
    file.filePath = req.file.path;
    file.mimeType = req.file.mimetype;

    await file.save();
    res.status(200).json(file);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const uploadSingleFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  try {
    const newFile = new File({
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      path: req.file.path,
      size: req.file.size,
    });
    const savedFile = await newFile.save();
    res.status(201).json(savedFile);
  } catch (error) {
    res.status(400).json({ message: 'Error uploading file', error: error.message });
  }
};
const uploadMultipleFiles = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }
  try {
    const savedFiles = await Promise.all(
      req.files.map(async file => {
        const newFile = new File({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          path: file.path,
          size: file.size,
        });
        return await newFile.save();
      })
    );
    res.status(201).json(savedFiles);
  } catch (error) {
    res.status(400).json({ message: 'Error uploading files', error: error.message });
  }
};
const handleMultiTypeUpload = async (req, res) => {
  if (!req.files) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }
  try {
    const savedFiles = {};
    for (const [fieldname, files] of Object.entries(req.files)) {
      savedFiles[fieldname] = await Promise.all(
        files.map(async file => {
          const newFile = new File({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            path: file.path,
            size: file.size,
          });
          return await newFile.save();
        })
      );
    }
    res.status(201).json(savedFiles);
  } catch (error) {
    res.status(400).json({ message: 'Error handling multi-type upload', error: error.message });
  }
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
  handleMultiTypeUpload,
  getFileByName,
  uploadFile,
  createChatFile,
  createAssistantFile,
  getMessageFileItemsByMessageId,
  createMessageFileItems,
};

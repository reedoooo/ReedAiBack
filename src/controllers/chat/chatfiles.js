const { ChatFile } = require('../../models');

const getAllChatFiles = async (req, res) => {
  try {
    const chatFiles = await ChatFile.find();
    res.status(200).json(chatFiles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat files', error: error.message });
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

const createChatFile = async (req, res) => {
  try {
    const newChatFile = new ChatFile(req.body);
    const savedChatFile = await newChatFile.save();
    res.status(201).json(savedChatFile);
  } catch (error) {
    res.status(400).json({ message: 'Error creating chat file', error: error.message });
  }
};

const updateChatFile = async (req, res) => {
  try {
    const updatedChatFile = await ChatFile.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedChatFile) {
      return res.status(404).json({ message: 'Chat file not found' });
    }
    res.status(200).json(updatedChatFile);
  } catch (error) {
    res.status(400).json({ message: 'Error updating chat file', error: error.message });
  }
};

const deleteChatFile = async (req, res) => {
  try {
    const deletedChatFile = await ChatFile.findByIdAndDelete(req.params.id);
    if (!deletedChatFile) {
      return res.status(404).json({ message: 'Chat file not found' });
    }
    res.status(200).json({ message: 'Chat file deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chat file', error: error.message });
  }
};

module.exports = {
  getAllChatFiles,
  getChatFileById,
  createChatFile,
  updateChatFile,
  deleteChatFile,
};
const { Folder: ChatFolder } = require('@/models');

const getAllChatFolders = async (req, res) => {
  try {
    const chatFolders = await ChatFolder.find();
    res.status(200).json(chatFolders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat folders', error: error.message });
  }
};

const getChatFolderById = async (req, res) => {
  try {
    const chatFolder = await ChatFolder.findById(req.params.id);
    if (!chatFolder) {
      return res.status(404).json({ message: 'Chat folder not found' });
    }
    res.status(200).json(chatFolder);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat folder', error: error.message });
  }
};

const createChatFolder = async (req, res) => {
  try {
    const newChatFolder = new ChatFolder(req.body);
    const savedChatFolder = await newChatFolder.save();
    res.status(201).json(savedChatFolder);
  } catch (error) {
    res.status(400).json({ message: 'Error creating chat folder', error: error.message });
  }
};

const updateChatFolder = async (req, res) => {
  try {
    const updatedChatFolder = await ChatFolder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedChatFolder) {
      return res.status(404).json({ message: 'Chat folder not found' });
    }
    res.status(200).json(updatedChatFolder);
  } catch (error) {
    res.status(400).json({ message: 'Error updating chat folder', error: error.message });
  }
};

const deleteChatFolder = async (req, res) => {
  try {
    const deletedChatFolder = await ChatFolder.findByIdAndDelete(req.params.id);
    if (!deletedChatFolder) {
      return res.status(404).json({ message: 'Chat folder not found' });
    }
    res.status(200).json({ message: 'Chat folder deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chat folder', error: error.message });
  }
};

module.exports = {
  getAllChatFolders,
  getChatFolderById,
  createChatFolder,
  updateChatFolder,
  deleteChatFolder,
};

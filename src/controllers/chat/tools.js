const { Tool: ChatTool } = require('../../models');

const getAllChatTools = async (req, res) => {
  try {
    const chatTools = await ChatTool.find();
    res.status(200).json(chatTools);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat tools', error: error.message });
  }
};

const getChatToolById = async (req, res) => {
  try {
    const chatTool = await ChatTool.findById(req.params.id);
    if (!chatTool) {
      return res.status(404).json({ message: 'Chat tool not found' });
    }
    res.status(200).json(chatTool);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat tool', error: error.message });
  }
};

const createChatTool = async (req, res) => {
  try {
    const newChatTool = new ChatTool(req.body);
    const savedChatTool = await newChatTool.save();
    res.status(201).json(savedChatTool);
  } catch (error) {
    res.status(400).json({ message: 'Error creating chat tool', error: error.message });
  }
};

const updateChatTool = async (req, res) => {
  try {
    const updatedChatTool = await ChatTool.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedChatTool) {
      return res.status(404).json({ message: 'Chat tool not found' });
    }
    res.status(200).json(updatedChatTool);
  } catch (error) {
    res.status(400).json({ message: 'Error updating chat tool', error: error.message });
  }
};

const deleteChatTool = async (req, res) => {
  try {
    const deletedChatTool = await ChatTool.findByIdAndDelete(req.params.id);
    if (!deletedChatTool) {
      return res.status(404).json({ message: 'Chat tool not found' });
    }
    res.status(200).json({ message: 'Chat tool deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chat tool', error: error.message });
  }
};

module.exports = {
  getAllChatTools,
  getChatToolById,
  createChatTool,
  updateChatTool,
  deleteChatTool,
};
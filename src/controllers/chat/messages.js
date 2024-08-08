const { Message: ChatMessage } = require('../../models');

const getAllChatMessages = async (req, res) => {
  try {
    const chatMessages = await ChatMessage.find();
    res.status(200).json(chatMessages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat messages', error: error.message });
  }
};

const getChatMessageById = async (req, res) => {
  try {
    const chatMessage = await ChatMessage.findById(req.params.id);
    if (!chatMessage) {
      return res.status(404).json({ message: 'Chat message not found' });
    }
    res.status(200).json(chatMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat message', error: error.message });
  }
};

const createChatMessage = async (req, res) => {
  try {
    const newChatMessage = new ChatMessage(req.body);
    const savedChatMessage = await newChatMessage.save();
    res.status(201).json(savedChatMessage);
  } catch (error) {
    res.status(400).json({ message: 'Error creating chat message', error: error.message });
  }
};

const updateChatMessage = async (req, res) => {
  try {
    const updatedChatMessage = await ChatMessage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedChatMessage) {
      return res.status(404).json({ message: 'Chat message not found' });
    }
    res.status(200).json(updatedChatMessage);
  } catch (error) {
    res.status(400).json({ message: 'Error updating chat message', error: error.message });
  }
};

const deleteChatMessage = async (req, res) => {
  try {
    const deletedChatMessage = await ChatMessage.findByIdAndDelete(req.params.id);
    if (!deletedChatMessage) {
      return res.status(404).json({ message: 'Chat message not found' });
    }
    res.status(200).json({ message: 'Chat message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chat message', error: error.message });
  }
};
module.exports = {
  getAllChatMessages,
  getChatMessageById,
  createChatMessage,
  updateChatMessage,
  deleteChatMessage,
};
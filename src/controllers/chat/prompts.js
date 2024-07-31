const { Prompt: ChatPrompt } = require('../../models');

const getAllChatPrompts = async (req, res) => {
  try {
    const chatPrompts = await ChatPrompt.find();
    res.status(200).json(chatPrompts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat prompts', error: error.message });
  }
};

const getChatPromptById = async (req, res) => {
  try {
    const chatPrompt = await ChatPrompt.findById(req.params.id);
    if (!chatPrompt) {
      return res.status(404).json({ message: 'Chat prompt not found' });
    }
    res.status(200).json(chatPrompt);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat prompt', error: error.message });
  }
};

const createChatPrompt = async (req, res) => {
  try {
    const newChatPrompt = new ChatPrompt(req.body);
    const savedChatPrompt = await newChatPrompt.save();
    res.status(201).json(savedChatPrompt);
  } catch (error) {
    res.status(400).json({ message: 'Error creating chat prompt', error: error.message });
  }
};

const updateChatPrompt = async (req, res) => {
  try {
    const updatedChatPrompt = await ChatPrompt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedChatPrompt) {
      return res.status(404).json({ message: 'Chat prompt not found' });
    }
    res.status(200).json(updatedChatPrompt);
  } catch (error) {
    res.status(400).json({ message: 'Error updating chat prompt', error: error.message });
  }
};

const deleteChatPrompt = async (req, res) => {
  try {
    const deletedChatPrompt = await ChatPrompt.findByIdAndDelete(req.params.id);
    if (!deletedChatPrompt) {
      return res.status(404).json({ message: 'Chat prompt not found' });
    }
    res.status(200).json({ message: 'Chat prompt deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chat prompt', error: error.message });
  }
};

module.exports = {
  getAllChatPrompts,
  getChatPromptById,
  createChatPrompt,
  updateChatPrompt,
  deleteChatPrompt,
};
const { Model: ChatModel } = require('@/models');

const getAllChatModels = async (req, res) => {
  try {
    const chatModels = await ChatModel.find();
    res.status(200).json(chatModels);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat models', error: error.message });
  }
};

const getChatModelById = async (req, res) => {
  try {
    const chatModel = await ChatModel.findById(req.params.id);
    if (!chatModel) {
      return res.status(404).json({ message: 'Chat model not found' });
    }
    res.status(200).json(chatModel);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat model', error: error.message });
  }
};

const createChatModel = async (req, res) => {
  try {
    const newChatModel = new ChatModel(req.body);
    const savedChatModel = await newChatModel.save();
    res.status(201).json(savedChatModel);
  } catch (error) {
    res.status(400).json({ message: 'Error creating chat model', error: error.message });
  }
};

const updateChatModel = async (req, res) => {
  try {
    const updatedChatModel = await ChatModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedChatModel) {
      return res.status(404).json({ message: 'Chat model not found' });
    }
    res.status(200).json(updatedChatModel);
  } catch (error) {
    res.status(400).json({ message: 'Error updating chat model', error: error.message });
  }
};

const deleteChatModel = async (req, res) => {
  try {
    const deletedChatModel = await ChatModel.findByIdAndDelete(req.params.id);
    if (!deletedChatModel) {
      return res.status(404).json({ message: 'Chat model not found' });
    }
    res.status(200).json({ message: 'Chat model deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chat model', error: error.message });
  }
};

module.exports = {
  getAllChatModels,
  getChatModelById,
  createChatModel,
  updateChatModel,
  deleteChatModel,
};

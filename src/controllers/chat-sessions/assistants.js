const { Assistant } = require('@/models');

const getAllChatAssistants = async (req, res) => {
  const chatAssistants = await Assistant.find();
  res.status(200).json(chatAssistants);
};

const getChatAssistantById = async (req, res) => {
  const chatAssistant = await Assistant.findById(req.params.id);
  if (!chatAssistant) {
    res.status(404);
    throw new Error('Chat assistant not found');
  }
  res.status(200).json(chatAssistant);
};

const createChatAssistant = async (req, res) => {
  const newChatAssistant = new Assistant(req.body);
  const savedChatAssistant = await newChatAssistant.save();
  res.status(201).json(savedChatAssistant);
};

const updateChatAssistant = async (req, res) => {
  const updatedChatAssistant = await Assistant.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updatedChatAssistant) {
    res.status(404);
    throw new Error('Chat assistant not found');
  }
  res.status(200).json(updatedChatAssistant);
};

const deleteChatAssistant = async (req, res) => {
  const deletedChatAssistant = await Assistant.findByIdAndDelete(req.params.id);
  if (!deletedChatAssistant) {
    res.status(404);
    throw new Error('Chat assistant not found');
  }
  res.status(200).json({ message: 'Chat assistant deleted successfully' });
};

module.exports = {
  getAllChatAssistants,
  getChatAssistantById,
  createChatAssistant,
  updateChatAssistant,
  deleteChatAssistant,
};

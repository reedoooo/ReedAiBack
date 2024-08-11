const { Collection: ChatCollection } = require('@/models');

const getAllChatCollections = async (req, res) => {
  try {
    const chatCollections = await ChatCollection.find();
    res.status(200).json(chatCollections);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat collections', error: error.message });
  }
};

const getChatCollectionById = async (req, res) => {
  try {
    const chatCollection = await ChatCollection.findById(req.params.id);
    if (!chatCollection) {
      return res.status(404).json({ message: 'Chat collection not found' });
    }
    res.status(200).json(chatCollection);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat collection', error: error.message });
  }
};

const createChatCollection = async (req, res) => {
  try {
    const newChatCollection = new ChatCollection(req.body);
    const savedChatCollection = await newChatCollection.save();
    res.status(201).json(savedChatCollection);
  } catch (error) {
    res.status(400).json({ message: 'Error creating chat collection', error: error.message });
  }
};

const updateChatCollection = async (req, res) => {
  try {
    const updatedChatCollection = await ChatCollection.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedChatCollection) {
      return res.status(404).json({ message: 'Chat collection not found' });
    }
    res.status(200).json(updatedChatCollection);
  } catch (error) {
    res.status(400).json({ message: 'Error updating chat collection', error: error.message });
  }
};

const deleteChatCollection = async (req, res) => {
  try {
    const deletedChatCollection = await ChatCollection.findByIdAndDelete(req.params.id);
    if (!deletedChatCollection) {
      return res.status(404).json({ message: 'Chat collection not found' });
    }
    res.status(200).json({ message: 'Chat collection deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chat collection', error: error.message });
  }
};

module.exports = {
  getAllChatCollections,
  getChatCollectionById,
  createChatCollection,
  updateChatCollection,
  deleteChatCollection,
  // --- additional ---
};

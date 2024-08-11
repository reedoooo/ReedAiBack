const { Preset: ChatPreset } = require('@/models');

const getAllChatPresets = async (req, res) => {
  try {
    const chatPresets = await ChatPreset.find();
    res.status(200).json(chatPresets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat presets', error: error.message });
  }
};

const getChatPresetById = async (req, res) => {
  try {
    const chatPreset = await ChatPreset.findById(req.params.id);
    if (!chatPreset) {
      return res.status(404).json({ message: 'Chat preset not found' });
    }
    res.status(200).json(chatPreset);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat preset', error: error.message });
  }
};

const createChatPreset = async (req, res) => {
  try {
    const newChatPreset = new ChatPreset(req.body);
    const savedChatPreset = await newChatPreset.save();
    res.status(201).json(savedChatPreset);
  } catch (error) {
    res.status(400).json({ message: 'Error creating chat preset', error: error.message });
  }
};

const updateChatPreset = async (req, res) => {
  try {
    const updatedChatPreset = await ChatPreset.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedChatPreset) {
      return res.status(404).json({ message: 'Chat preset not found' });
    }
    res.status(200).json(updatedChatPreset);
  } catch (error) {
    res.status(400).json({ message: 'Error updating chat preset', error: error.message });
  }
};

const deleteChatPreset = async (req, res) => {
  try {
    const deletedChatPreset = await ChatPreset.findByIdAndDelete(req.params.id);
    if (!deletedChatPreset) {
      return res.status(404).json({ message: 'Chat preset not found' });
    }
    res.status(200).json({ message: 'Chat preset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chat preset', error: error.message });
  }
};

module.exports = {
  getAllChatPresets,
  getChatPresetById,
  createChatPreset,
  updateChatPreset,
  deleteChatPreset,
};

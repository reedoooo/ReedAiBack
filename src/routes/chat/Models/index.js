const express = require('express');
const { Model, Workspace } = require('../../../models');
const router = express.Router();

// Fetch all chat models
router.get('/chat_model', async (req, res) => {
  try {
    const chatModels = await Model.find();
    res.json(chatModels);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Fetch default chat model
router.get('/default', async (req, res) => {
  try {
    const defaultChatModel = await Model.findOne({ isDefault: true }); // Assuming there's a flag for default
    res.json(defaultChatModel);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Fetch a single chat model by ID
router.get('/:id', async (req, res) => {
  try {
    const chatModel = await Model.findById(req.params.id);
    if (!chatModel) {
      return res.status(404).send('Chat model not found');
    }
    res.json(chatModel);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Create a new chat model
router.post('/chat_model', async (req, res) => {
  try {
    const newChatModel = new Model(req.body);
    const chatModel = await newChatModel.save();
    res.json(chatModel);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Update an existing chat model by ID
router.put('/:id', async (req, res) => {
  try {
    const chatModel = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!chatModel) {
      return res.status(404).send('Chat model not found');
    }
    res.json(chatModel);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Delete a chat model by ID
router.delete('/:id', async (req, res) => {
  try {
    const chatModel = await Model.findByIdAndDelete(req.params.id);
    if (!chatModel) {
      return res.status(404).send('Chat model not found');
    }
    res.json({ msg: 'Chat model deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

router.get('/:workspaceId', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId).populate('models');
    res.json({ workspace });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const path = require('path');
const fs = require('fs');
const assistantService = require('./service');

const getAssistantImage = async (req, res) => {
  const { assistantId } = req.params;

  try {
    const imagePath = await assistantService.getAssistantImage(assistantId);
    res.sendFile(path.resolve(imagePath));
  } catch (error) {
    res.status(500).send('Error retrieving image: ' + error.message);
  }
};

const uploadAssistantImage = async (req, res) => {
  const { assistantId } = req.params;
  const image = req.file;

  try {
    const imagePath = await assistantService.uploadAssistantImage(assistantId, image);
    res.status(200).send({ imagePath });
  } catch (error) {
    res.status(500).send('Error uploading image: ' + error.message);
  }
};

const getAssistants = async (req, res) => {
  try {
    const { userId, clientApiKey } = req.body;
    const assistants = await assistantService.getAssistants(userId, clientApiKey);
    res.status(200).json({ assistants });
  } catch (error) {
    const errorMessage = error.message || 'An unexpected error occurred';
    res.status(500).json({ message: errorMessage });
  }
};

const createAssistant = async (req, res) => {
  try {
    const { name, instructions, tools, model, userId, clientApiKey } = req.body;
    const assistant = await assistantService.createAssistant({
      name,
      instructions,
      tools,
      model,
      userId,
      clientApiKey,
    });
    res.status(201).json({ assistant });
  } catch (error) {
    const errorMessage = error.message || 'An unexpected error occurred';
    res.status(500).json({ message: errorMessage });
  }
};

const updateAssistant = async (req, res) => {
  try {
    const { assistantId, name, instructions, tools, model, userId, clientApiKey } = req.body;
    const assistant = await assistantService.updateAssistant({
      assistantId,
      name,
      instructions,
      tools,
      model,
      userId,
      clientApiKey,
    });
    res.status(200).json({ assistant });
  } catch (error) {
    const errorMessage = error.message || 'An unexpected error occurred';
    res.status(500).json({ message: errorMessage });
  }
};

const deleteAssistant = async (req, res) => {
  try {
    const { assistantId, userId, clientApiKey } = req.body;
    await assistantService.deleteAssistant({ assistantId, userId, clientApiKey });
    res.status(204).json({});
  } catch (error) {
    const errorMessage = error.message || 'An unexpected error occurred';
    res.status(500).json({ message: errorMessage });
  }
};

module.exports = {
  getAssistants,
  createAssistant,
  updateAssistant,
  deleteAssistant,
  getAssistantImage,
  uploadAssistantImage,
};

// services/promptService.js
const dbService = require('./dbService');
const mongoose = require('mongoose');
const Prompt = mongoose.model('Prompt');

// Function to create a new Prompt
const createPrompt = async data => {
  return await dbService.createDocument('Prompt', data);
};

// Function to find all Prompts
const findAllPrompts = async () => {
  return await dbService.findAllDocuments('Prompt');
};

// Function to update a Prompt by ID
const updatePromptById = async (id, data) => {
  return await dbService.updateDocumentById('Prompt', id, data);
};

// Function to delete a Prompt by ID
const deletePromptById = async id => {
  return await dbService.deleteDocumentById('Prompt', id);
};

// Function to find Prompts by userId
const findPromptsByUserId = async userId => {
  return await Prompt.find({ userId }).populate('workspaceId folderId');
};

// Function to find a Prompt by promptId
const findPromptById = async promptId => {
  return await Prompt.findById(promptId).populate('workspaceId folderId');
};

module.exports = {
  createPrompt,
  findAllPrompts,
  updatePromptById,
  deletePromptById,
  findPromptsByUserId,
  findPromptById,
};

// services/assistantService.js
const dbService = require('../dbService');
const mongoose = require('mongoose');
const Assistant = mongoose.model('Assistant');

// Function to create a new Assistant
const createAssistant = async data => {
  return await dbService.createDocument('Assistant', data);
};

// Function to find all Assistants
const findAllAssistants = async () => {
  return await dbService.findAllDocuments('Assistant');
};

// Function to update an Assistant by ID
const updateAssistantById = async (id, data) => {
  return await dbService.updateDocumentById('Assistant', id, data);
};

// Function to delete an Assistant by ID
const deleteAssistantById = async id => {
  return await dbService.deleteDocumentById('Assistant', id);
};

// Function to find Assistants by userId
const findAssistantsByUserId = async userId => {
  return await Assistant.find({ userId }).populate('workspaceId folderId tools toolResources.codeInterpreter.fileIds');
};

// Function to find an Assistant by assistantId
const findAssistantById = async assistantId => {
  return await Assistant.findById(assistantId).populate(
    'workspaceId folderId tools toolResources.codeInterpreter.fileIds'
  );
};

module.exports = {
  createAssistant,
  findAllAssistants,
  updateAssistantById,
  deleteAssistantById,
  findAssistantsByUserId,
  findAssistantById,
};

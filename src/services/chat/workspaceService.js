// services/workspaceService.js
const mongoose = require('mongoose');
const Workspace = mongoose.model('Workspace');

// Function to create a new Workspace
const createWorkspace = async (data) => {
  return await dbService.createDocument('Workspace', data);
};

// Function to find all Workspaces
const findAllWorkspaces = async () => {
  return await dbService.findAllDocuments('Workspace');
};

// Function to update a Workspace by ID
const updateWorkspaceById = async (id, data) => {
  return await dbService.updateDocumentById('Workspace', id, data);
};

// Function to delete a Workspace by ID
const deleteWorkspaceById = async (id) => {
  return await dbService.deleteDocumentById('Workspace', id);
};

// Function to find a workspace by userId
const findWorkspaceByUserId = async (userId) => {
  return await Workspace.find({ userId }).populate('chatSessions folders tools presets assistants prompts models files collections');
};

// Function to find a workspace by workspaceId
const findWorkspaceById = async (workspaceId) => {
  return await Workspace.findById(workspaceId).populate('chatSessions folders tools presets assistants prompts models files collections');
};

module.exports = {
  createWorkspace,
  findAllWorkspaces,
  updateWorkspaceById,
  deleteWorkspaceById,
  findWorkspaceByUserId,
  findWorkspaceById
};
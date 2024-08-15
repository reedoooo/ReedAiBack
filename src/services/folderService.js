// services/folderService.js
const dbService = require('./dbService');
const mongoose = require('mongoose');
const Folder = mongoose.model('Folder');

// Function to create a new Folder
const createFolder = async data => {
  return await dbService.createDocument('Folder', data);
};

// Function to find all Folders
const findAllFolders = async () => {
  return await dbService.findAllDocuments('Folder');
};

// Function to update a Folder by ID
const updateFolderById = async (id, data) => {
  return await dbService.updateDocumentById('Folder', id, data);
};

// Function to delete a Folder by ID
const deleteFolderById = async id => {
  return await dbService.deleteDocumentById('Folder', id);
};

// Function to find Folders by userId
const findFoldersByUserId = async userId => {
  return await Folder.find({ userId }).populate('workspaceId parent subfolders');
};

// Function to find a Folder by folderId
const findFolderById = async folderId => {
  return await Folder.findById(folderId).populate('workspaceId parent subfolders');
};

module.exports = {
  createFolder,
  findAllFolders,
  updateFolderById,
  deleteFolderById,
  findFoldersByUserId,
  findFolderById,
};

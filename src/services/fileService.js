// services/fileService.js
const dbService = require('./dbService');
const mongoose = require('mongoose');
const File = mongoose.model('File');

// Function to create a new File
const createFile = async data => {
  return await dbService.createDocument('File', data);
};

// Function to find all Files
const findAllFiles = async () => {
  return await dbService.findAllDocuments('File');
};

// Function to update a File by ID
const updateFileById = async (id, data) => {
  return await dbService.updateDocumentById('File', id, data);
};

// Function to delete a File by ID
const deleteFileById = async id => {
  return await dbService.deleteDocumentById('File', id);
};

// Function to find Files by userId
const findFilesByUserId = async userId => {
  return await File.find({ userId }).populate('workspaceId sessionId folderId messageId');
};

// Function to find a File by fileId
const findFileById = async fileId => {
  return await File.findById(fileId).populate('workspaceId sessionId folderId messageId');
};

module.exports = {
  createFile,
  findAllFiles,
  updateFileById,
  deleteFileById,
  findFilesByUserId,
  findFileById,
};

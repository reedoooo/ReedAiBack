// services/dbService.js
const mongoose = require('mongoose');

// Function to create a new document in the specified model
const createDocument = async (modelName, data) => {
  const Model = mongoose.model(modelName);
  const document = new Model(data);
  return await document.save();
};

// Function to find all documents in the specified model
const findAllDocuments = async (modelName) => {
  const Model = mongoose.model(modelName);
  return await Model.find({});
};

// Function to update a document by ID in the specified model
const updateDocumentById = async (modelName, id, data) => {
  const Model = mongoose.model(modelName);
  return await Model.findByIdAndUpdate(id, data, { new: true });
};

// Function to delete a document by ID in the specified model
const deleteDocumentById = async (modelName, id) => {
  const Model = mongoose.model(modelName);
  return await Model.findByIdAndDelete(id);
};

module.exports = {
  createDocument,
  findAllDocuments,
  updateDocumentById,
  deleteDocumentById
};
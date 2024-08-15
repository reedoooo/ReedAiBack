// services/messageService.js
const dbService = require('./dbService');
const mongoose = require('mongoose');
const Message = mongoose.model('Message');

// Function to create a new Message
const createMessage = async data => {
  return await dbService.createDocument('Message', data);
};

// Function to find all Messages
const findAllMessages = async () => {
  return await dbService.findAllDocuments('Message');
};

// Function to update a Message by ID
const updateMessageById = async (id, data) => {
  return await dbService.updateDocumentById('Message', id, data);
};

// Function to delete a Message by ID
const deleteMessageById = async id => {
  return await dbService.deleteDocumentById('Message', id);
};

// Function to find Messages by userId
const findMessagesByUserId = async userId => {
  return await Message.find({ userId }).populate('sessionId assistantId files');
};

// Function to find a Message by messageId
const findMessageById = async messageId => {
  return await Message.findById(messageId).populate('sessionId assistantId files');
};

module.exports = {
  createMessage,
  findAllMessages,
  updateMessageById,
  deleteMessageById,
  findMessagesByUserId,
  findMessageById,
};

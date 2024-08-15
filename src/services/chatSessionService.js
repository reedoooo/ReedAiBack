// services/chatSessionService.js
const dbService = require('./dbService');
const mongoose = require('mongoose');
const ChatSession = mongoose.model('ChatSession');

// Function to create a new ChatSession
const createChatSession = async data => {
  return await dbService.createDocument('ChatSession', data);
};

// Function to find all ChatSessions
const findAllChatSessions = async () => {
  return await dbService.findAllDocuments('ChatSession');
};

// Function to update a ChatSession by ID
const updateChatSessionById = async (id, data) => {
  return await dbService.updateDocumentById('ChatSession', id, data);
};

// Function to delete a ChatSession by ID
const deleteChatSessionById = async id => {
  return await dbService.deleteDocumentById('ChatSession', id);
};

// Function to find ChatSessions by userId
const findChatSessionsByUserId = async userId => {
  return await ChatSession.find({ userId }).populate('workspaceId assistantId systemPrompt tools messages files');
};

// Function to find a ChatSession by chatSessionId
const findChatSessionById = async chatSessionId => {
  return await ChatSession.findById(chatSessionId).populate(
    'workspaceId assistantId systemPrompt tools messages files'
  );
};

module.exports = {
  createChatSession,
  findAllChatSessions,
  updateChatSessionById,
  deleteChatSessionById,
  findChatSessionsByUserId,
  findChatSessionById,
};

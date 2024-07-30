const { Pinecone } = require('@pinecone-database/pinecone');
const { ChatFile } = require('../../../models');

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const getPCChatFilesByChatId = async chatId => {
  try {
    const chatFilesIndex = pinecone.Index('chat-files');
    const chatFiles = await chatFilesIndex.fetch([chatId]);

    if (!chatFiles[chatId]) {
      throw new Error('Chat files not found');
    }

    return chatFiles[chatId];
  } catch (error) {
    throw new Error(error.message);
  }
};

const createPCChatFile = async chatFile => {
  try {
    const chatFilesIndex = pinecone.Index('chat-files');
    const response = await chatFilesIndex.upsert([chatFile]);

    if (response.upserted.length === 0) {
      throw new Error('Failed to create chat file');
    }

    return chatFile;
  } catch (error) {
    throw new Error(error.message);
  }
};

const createPCChatFiles = async chatFiles => {
  try {
    const chatFilesIndex = pinecone.Index('chat-files');
    const response = await chatFilesIndex.upsert(chatFiles);

    if (response.upserted.length !== chatFiles.length) {
      throw new Error('Failed to create some chat files');
    }

    return chatFiles;
  } catch (error) {
    throw new Error(error.message);
  }
};
const createChatFile = async ({ sessionUuid, userId, name, data, mimeType }) => {
  const chatFile = new ChatFile({ sessionUuid, userId, name, data, mimeType });
  return chatFile.save();
};

const getChatFileByID = async id => {
  return ChatFile.findById(id);
};

const deleteChatFile = async id => {
  return ChatFile.findByIdAndDelete(id);
};

const listChatFilesBySessionId = async (sessionUuid, userId) => {
  return ChatFile.find({ sessionUuid, userId });
};
module.exports = {
  getPCChatFilesByChatId,
  createPCChatFile,
  createPCChatFiles,
  createChatFile,
  getChatFileByID,
  deleteChatFile,
  listChatFilesBySessionId,
};

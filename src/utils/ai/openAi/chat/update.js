const { Message } = require('@/models');
const { MongoDBChatMessageHistory } = require('@langchain/mongodb');
const { BufferMemory } = require('langchain/memory');
const { logger } = require('@/config/logging');
const { initializeChatHistory } = require('./initialize');

const addMessageToChatHistory = async (chatSession, messageData) => {
  try {
    const history = initializeChatHistory(chatSession);
    const memory = new BufferMemory({
      chatHistory: history,
      returnMessages: true,
      memoryKey: 'history',
    });

    logger.info(`Adding message to chat history: ${JSON.stringify(messageData)}`);

    const newMessageData = {
      ...messageData,
      sessionId: chatSession._id,
      sequenceNumber: (await Message.countDocuments({ sessionId: chatSession._id })) + 1,
      metadata: {
        ...messageData.metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        sessionId: chatSession._id,
      },
    };

    const newMessage = new Message(newMessageData);
    await newMessage.save();

    await history.addMessage({
      type: messageData.role === 'user' ? 'human' : 'ai',
      data: {
        content: newMessageData.content,
        additional_kwargs: newMessageData.metadata,
      },
    });

    return newMessage;
  } catch (error) {
    logger.error(`Error adding message to chat history: ${error.message}`);
    throw error;
  }
};

const updateMessageInChatHistory = async (chatSession, messageId, updatedData) => {
  try {
    const history = initializeChatHistory(chatSession);

    const updatedMessage = await Message.findOneAndUpdate(
      { _id: messageId, sessionId: chatSession._id },
      {
        $set: {
          ...updatedData,
          'metadata.updatedAt': Date.now(),
        },
      },
      { new: true }
    );

    if (!updatedMessage) {
      throw new Error('Message not found');
    }

    const messages = await history.getMessages();
    const updatedMessages = messages.map((msg) =>
      msg.id === messageId ? {
        type: updatedMessage.role === 'user' ? 'human' : 'ai',
        data: {
          content: updatedMessage.content,
          additional_kwargs: updatedMessage.metadata,
        },
      } : msg
    );

    await history.clear();
    for (const msg of updatedMessages) {
      await history.addMessage(msg);
    }

    return updatedMessage;
  } catch (error) {
    logger.error(`Error updating message in chat history: ${error.message}`);
    throw error;
  }
};

const deleteMessageFromChatHistory = async (chatSession, messageId) => {
  try {
    const history = initializeChatHistory(chatSession);

    const deletedMessage = await Message.findOneAndDelete({
      _id: messageId,
      sessionId: chatSession._id,
    });

    if (!deletedMessage) {
      throw new Error('Message not found');
    }

    const messages = await history.getMessages();
    const remainingMessages = messages.filter((msg) => msg.id !== messageId);

    await history.clear();
    for (const msg of remainingMessages) {
      await history.addMessage(msg);
    }

    await Message.updateMany(
      { sessionId: chatSession._id, sequenceNumber: { $gt: deletedMessage.sequenceNumber } },
      { $inc: { sequenceNumber: -1 } }
    );

    return deletedMessage;
  } catch (error) {
    logger.error(`Error deleting message from chat history: ${error.message}`);
    throw error;
  }
};

const retrieveChatHistory = async (chatSession, limit = 50) => {
  try {
    const history = initializeChatHistory(chatSession);
    const messages = await history.getMessages();
    return messages.slice(-limit).reverse();
  } catch (error) {
    logger.error(`Error retrieving chat history: ${error.message}`);
    throw error;
  }
};

const clearChatHistory = async (chatSession) => {
  try {
    const history = initializeChatHistory(chatSession);
    await Message.deleteMany({ sessionId: chatSession._id });
    await history.clear();
  } catch (error) {
    logger.error(`Error clearing chat history: ${error.message}`);
    throw error;
  }
};

const updateMessageEmbedding = async (chatSession, messageId, embeddingType, embeddingValue) => {
  try {
    const history = initializeChatHistory(chatSession);

    const updatedMessage = await Message.findOneAndUpdate(
      { _id: messageId, sessionId: chatSession._id },
      {
        $set: {
          [embeddingType]: embeddingValue,
          'metadata.updatedAt': Date.now(),
        },
      },
      { new: true }
    );

    if (!updatedMessage) {
      throw new Error('Message not found');
    }

    const messages = await history.getMessages();
    const updatedMessages = messages.map((msg) =>
      msg.id === messageId ? {
        type: updatedMessage.role === 'user' ? 'human' : 'ai',
        data: {
          content: updatedMessage.content,
          additional_kwargs: {
            ...updatedMessage.metadata,
            [embeddingType]: embeddingValue,
          },
        },
      } : msg
    );

    await history.clear();
    for (const msg of updatedMessages) {
      await history.addMessage(msg);
    }

    return updatedMessage;
  } catch (error) {
    logger.error(`Error updating message embedding: ${error.message}`);
    throw error;
  }
};

module.exports = {
  initializeChatHistory,
  addMessageToChatHistory,
  updateMessageInChatHistory,
  deleteMessageFromChatHistory,
  retrieveChatHistory,
  clearChatHistory,
  updateMessageEmbedding,
};
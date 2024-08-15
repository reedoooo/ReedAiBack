// src/messageFactory.js
// const { HumanMessage, AIMessage, SystemMessage, FunctionMessage, ToolMessage } = require('langchain');
const { tools } = require('./static/tool');
const { assistantPrompts } = require('./static/assistant');
const { systemPrompts } = require('./static/system'); // Assuming you have system prompts
const { HumanMessage, AIMessage, SystemMessage, FunctionMessage, ToolMessage } = require('@langchain/core/messages');
const { Message } = require('@/models');

const createMessage = async (type, content, sessionId, userId, sequenceNumber, name, additionalParams = {}) => {
  let newMessage;
  let messageId;

  // Save the message to MongoDB
  switch (type) {
    case 'human':
      newMessage = new Message({
        sessionId,
        role: type,
        content,
        userId,
        sequenceNumber,
        metaData: {},
      });
      await newMessage.save();
      messageId = newMessage._id;
      return { message: new HumanMessage({ content, ...additionalParams }), messageId };

    case 'ai':
    case 'assistant':
      const assistantMessage = assistantPrompts[name];
      newMessage = new Message({
        sessionId,
        role: type,
        content: assistantMessage,
        userId,
        sequenceNumber,
        metaData: {},
      });
      await newMessage.save();
      messageId = newMessage._id;
      return { message: new AIMessage({ content: assistantMessage, ...additionalParams }), messageId };

    case 'system':
      const systemMessage = systemPrompts[name];
      newMessage = new Message({
        sessionId,
        role: type,
        content: systemMessage,
        userId,
        sequenceNumber,
        metaData: {},
      });
      await newMessage.save();
      messageId = newMessage._id;
      return { message: new SystemMessage({ content: systemMessage, ...additionalParams }), messageId };

    case 'function':
      newMessage = new Message({
        sessionId,
        role: type,
        content,
        userId,
        sequenceNumber,
        metaData: {},
      });
      await newMessage.save();
      messageId = newMessage._id;
      return { message: new FunctionMessage({ content, ...additionalParams }), messageId };

    case 'tool':
      const toolMessage = tools[name];
      newMessage = new Message({
        sessionId,
        role: type,
        content: toolMessage,
        userId,
        sequenceNumber,
        metaData: {},
      });
      await newMessage.save();
      messageId = newMessage._id;
      return { message: new ToolMessage({ content: toolMessage, ...additionalParams }), messageId };

    default:
      throw new Error(`Unknown message type: ${type}`);
  }
};

module.exports = { createMessage };

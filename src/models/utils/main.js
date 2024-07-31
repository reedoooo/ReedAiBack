const { ChatSession, Message } = require('../index.js');
const { parseMessagesToHTML } = require('../../utils/processing');
const { createSystemPromptB } = require('../../utils/ai');
const logger = require('../../config/logging/index');

const createMessage = async (sessionId, role, content, userId, sequenceNumber) => {
  const message = new Message({
    sessionId,
    role,
    content,
    userId,
    // tokens: content.split(' ').length
    sequenceNumber,
    metaData: {},
  });
  await message.save();
  return message._id;
};

const getSessionMessages = async sessionId => {
  try {
    const chatSession = await ChatSession.findById(sessionId).populate('messages');
    if (!chatSession) {
      throw new Error('Chat session not found');
    }

    const messagePromises = chatSession?.messages?.map(async msg => {
      const foundMessage = await Message.findById(msg);
      if (foundMessage) {
        return {
          _id: foundMessage._id,
          role: foundMessage.role,
          content: foundMessage.content,
        };
      }
      return null;
    });

    let chatMessages = await Promise.all(messagePromises);

    chatMessages = chatMessages.filter(
      (msg, index, self) => msg && index === self.findIndex(m => m.content === msg.content)
    );

    logger.info('Fetched session messages:', chatMessages);

    const systemPrompt = createSystemPromptB();
    const systemMessageIndex = chatMessages.findIndex(msg => msg.role === 'system');
    if (systemMessageIndex !== -1) {
      await Message.findByIdAndUpdate(chatMessages[systemMessageIndex]._id, { content: systemPrompt });
      chatMessages[systemMessageIndex].content = systemPrompt;
    } else {
      const newSystemMessage = {
        role: 'system',
        content: systemPrompt,
      };
      chatMessages.unshift(newSystemMessage);
      const systemMessageId = await createMessage(sessionId, 'system', systemPrompt, null, 1);
      chatSession.messages.unshift(systemMessageId);
      await chatSession.save();
    }
    return chatMessages;
  } catch (error) {
    console.error('Error fetching session messages:', error);
    throw error;
  }
};

const initializeChatSession = async (sessionId, userId) => {
  try {
    let chatSession = await ChatSession.findById({
      _id: sessionId,
    });
    if (!chatSession) {
      chatSession = new ChatSession({
        name: `Chat ${sessionId}`,
        userId,
        topic: 'New Chat',
        active: true,
        model: 'gpt-4-1106-preview',
        settings: {
          maxTokens: 1000,
          temperature: 0.7,
          topP: 1.0,
          n: 1,
        },
        messages: [],
        tuning: {
          debug: false,
          summary: '',
          summarizeMode: false,
        },
      });
      logger.info(`Created new chat session: ${chatSession._id}`);
      await chatSession.save();
    }

    // CLEAR PREVIOUS CHAT HISTORY
    await Message.deleteMany({ sessionId: chatSession._id });
    await chatSession.updateOne({}, { $set: { messages: [] } });

    // SAVE CLEARED CHAT HISTORY
    await chatSession.save();

    // PARSE ALL MESSAGES TO HTML
    // const messages = await Message.find({ sessionId: chatSession._id });
    // const parsedMessagesHTML = parseMessagesToHTML(messages);
    // logger.info(`Parsed ${messages.length} messages to HTML: ${parsedMessagesHTML}`, parsedMessagesHTML);
    return chatSession;
  } catch (error) {
    logger.error('Error initializing chat session:', error.message);
    throw error;
  }
};

module.exports = {
  createMessage,
  getSessionMessages,
  initializeChatSession,
};

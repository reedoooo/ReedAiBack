const mongoose = require('mongoose');
const { ChatSession, Message } = require('../../models');

/**
 * Save messages to a chat session.
 * @param {String} sessionId - The ID of the chat session.
 * @param {Array} messages - Array of message objects to be saved.
 */
const saveMessagesToSession = async (sessionId, messages) => {
  try {
    // Find the chat session by ID and populate existing messages
    const chatSession = await ChatSession.findById(sessionId).populate('messages');
    if (!chatSession) {
      throw new Error('Chat session not found');
    }

    // Extract existing messageIds from the session
    const existingMessageIds = chatSession?.messages.map(msg => msg.messageId);

    // Filter out messages that already exist in the session
    const newMessagesData = messages.filter(message => !existingMessageIds.includes(message.messageId));

    // Iterate over each new message and create ChatMessage documents
    const newMessages = await Promise.all(
      newMessagesData.map(async message => {
        const newMessage = new Message({
          sessionId,
          type: message.role || 'message',
          data: {
            content: message.content,
            additional_kwargs: message.additional_kwargs || {},
          },
          assistantId: message.assistantId,
          userId: message.userId,
          messageId: message.messageId,
          conversationId: message.conversationId,
          content: message.content,
          role: message.role,
          tokens: message.tokens,
          localEmbedding: message.localEmbedding,
          openaiEmbedding: message.openaiEmbedding,
          sharing: message.sharing,
          sequenceNumber: message.sequenceNumber,
          metadata: message.metadata || {},
        });
        await newMessage.save();
        return newMessage;
      })
    );

    // Add new messages to the chat session
    chatSession.messages.push(...newMessages.map(msg => msg._id));
    chatSession.stats.messageCount += newMessages.length;
    await chatSession.save();

    console.log(`Messages saved successfully to session ${sessionId}`);
  } catch (error) {
    console.error('Error saving messages:', error.message);
    throw error;
  }
};
module.exports = {
  saveMessagesToSession,
};

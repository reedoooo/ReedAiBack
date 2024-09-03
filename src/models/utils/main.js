const { getMainSystemMessageContent } = require('@/lib/prompts/createPrompt.js');
const { logger } = require('@/config/logging/logger.js');
const { Message, ChatSession, Workspace, User } = require('@/models');

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

    const systemPrompt = getMainSystemMessageContent();
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
      chatSession.systemPrompt = systemMessageId;
      chatSession.messages.unshift(systemMessageId);
      await chatSession.save();
    }
    // logger.info(`FETCHED SESSION ${chatMessages.length} MESSAGES: ${JSON.stringify(chatMessages)}`, chatMessages);
    return chatMessages;
  } catch (error) {
    console.error('Error fetching session messages:', error);
    throw error;
  }
};

const initializeChatSession = async (providedSessionId, providedWorkspaceId, userId, prompt, sessionLength) => {
  try {
    let chatSession;
    if (providedSessionId & providedWorkspaceId & userId) {
      chatSession = await ChatSession.findById({
        _id: providedSessionId,
      });
    }

    if (!chatSession) {
      logger.info(`[ATTEMPTING SESSION CREATION] WORKSPACE: ${providedWorkspaceId} USER: ${userId}`);
      try {
        chatSession = new ChatSession({
          name: `${prompt}-${providedWorkspaceId}`,
          workspaceId: providedWorkspaceId,
          userId: userId,
          topic: prompt,
          active: true,
          model: 'gpt-4-1106-preview',
          settings: {
            maxTokens: 3000,
            temperature: 0.9,
            topP: 1.0,
          },
          messages: [],
          systemPrompt: null,
          tools: [],
          files: [],
          summary: '',
          active: true,
          model: 'gpt-4-1106-preview',
          topic: prompt,
          stats: {
            tokenUsage: 0,
            messageCount: 0,
          },
          settings: {
            contextCount: 15,
            maxTokens: 500, // max length of the completion
            temperature: 0.7,
            model: 'gpt-4-1106-preview',
            topP: 1,
            n: 4,
            debug: false,
            summarizeMode: false,
          },
          tuning: {
            debug: false,
            summary: '',
            summarizeMode: false,
          },
        });
        await chatSession.save();
        logger.info(`Session Creation Successful: ${chatSession._id}`);
        const workspace = await Workspace.findById(providedWorkspaceId);
        if (workspace) {
          workspace.chatSessions.push(chatSession._id);
          await workspace.save();
          logger.info(`Added chat session ${chatSession._id} to workspace ${workspace._id}`);
        } else {
          throw new Error('Workspace not found');
        }
        const user = await User.findById(userId);
        if (user) {
          user.chatSessions.push(chatSession._id);
          await user.save();
          logger.info(`Added chat session ${chatSession._id} to user ${user._id}`);
        } else {
          throw new Error('User not found');
        }
      } catch (error) {
        logger.error(
        `Error initializing chat session:
        [message][${error.message}]
        [error][${error}]
        [sessionId] ${providedSessionId}
        [userId] ${userId},`,
          error
        );
        throw error;
      }
    }

    // CLEAR PREVIOUS CHAT HISTORY
    // await Message.deleteMany({ sessionId: chatSession._id });
    // await chatSession.updateOne({}, { $set: { messages: [] } });

    // SAVE CLEARED CHAT HISTORY
    await chatSession.save();
    return chatSession;
  } catch (error) {
    logger.error(
      `Error initializing chat session:
      [message][${error.message}]
      [error][${error}]
      [sessionId] ${providedSessionId}
      [userId] ${userId},`,
      error
    );
    throw error;
  }
};

module.exports = {
  createMessage,
  getSessionMessages,
  initializeChatSession,
};

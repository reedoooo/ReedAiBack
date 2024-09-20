// src/utils/chat.js
const { MongoDBChatMessageHistory } = require('@langchain/mongodb');
const { summarizeMessages, extractSummaries } = require('./context.js');
const { Message, ChatSession, Workspace, User } = require('@/models');
const { logger } = require('@/config/logging/logger.js');
const { Pinecone } = require('@pinecone-database/pinecone');
const { ChatOpenAI, OpenAIEmbeddings } = require('@langchain/openai');
const { tools } = require('@/lib/functions/tools.js');
// const { tool } = require('@langchain/core/tools.js');

const initializeOpenAI = (apiKey, chatSession, completionModel) => {
  const configs = {
    modelName: completionModel,
    temperature: 0.4,
    maxTokens: 3000,
    streaming: true,
    openAIApiKey: apiKey || process.env.OPENAI_API_PROJECT_KEY,
    organization: 'reed_tha_human',
    tools: tools,
    code_interpreter: 'auto',
    function_call: 'auto',
    callbacks: {
      handleLLMNewToken: (token) => {
        logger.info(`New token: ${token}`);
      },
      // handleFinalChunk: chunk => {
      //   logger.info(`Final chunk: ${chunk}`);
      // },
    },
  };
  return new ChatOpenAI(configs);
};

const initializePinecone = () => {
  return new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
};

const initializeEmbeddings = (apiKey) => {
  return new OpenAIEmbeddings({
    modelName: 'text-embedding-3-small',
    apiKey: apiKey || process.env.OPENAI_API_PROJECT_KEY,
    dimensions: 512,
  });
};

const initializeChatHistory = (chatSession) => {
  return new MongoDBChatMessageHistory({
    collection: chatSession.collection,
    sessionId: chatSession._id.toString(),
  });
};

const initializeChatSession = async (sessionId, workspaceId, userId, prompt, sessionLength) => {
  try {
    let chatSession = await ChatSession.findById(sessionId);
    // if (sessionId & workspaceId & userId) {
    //   chatSession = await ChatSession.findById({
    //     _id: sessionId,
    //   });
    // }

    if (!chatSession) {
      logger.info(`[ATTEMPTING SESSION CREATION] WORKSPACE: ${workspaceId} USER: ${userId}`);
      try {
        chatSession = new ChatSession({
          name: `${prompt}-${workspaceId}`,
          workspaceId: workspaceId,
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
        const workspace = await Workspace.findById(workspaceId);
        if (workspace) {
          workspace.chatSessions.push(chatSession._id);
          await workspace.save();
        } else {
          throw new Error('Workspace not found');
        }
        const user = await User.findById(userId);
        if (user) {
          user.chatSessions.push(chatSession._id);
          await user.save();
        } else {
          throw new Error('User not found');
        }
      } catch (error) {
        logger.error(
          `Error initializing chat session:
        [message][${error.message}]
        [error][${error}]
        [sessionId] ${sessionId}
        [userId] ${userId},`,
          error
        );
        throw error;
      }
    } else {
      logger.info(`Chat session found: ${chatSession._id}`);
      const currentPromptHistory = chatSession.promptHistory;
      chatSession.promptHistory = [...currentPromptHistory, prompt];
    }
    // SAVE CLEARED CHAT HISTORY
    await chatSession.save();
    return chatSession;
  } catch (error) {
    logger.error(
      `Error initializing chat session:
      [message][${error.message}]
      [error][${error}]
      [sessionId] ${sessionId}
      [userId] ${userId},`,
      error
    );
    throw error;
  }
};
const handleSummarization = async (messages, chatOpenAI) => {
  try {
    const summary = await summarizeMessages(messages.slice(-5), chatOpenAI);
    const { overallSummaryString, individualSummariesArray } = extractSummaries(summary);
    logger.info(`Overall Summary: ${overallSummaryString}`);
    logger.info(`Individual Summaries: ${JSON.stringify(individualSummariesArray)}`);
    return summary;
  } catch (error) {
    logger.error('Error in handleSummarization:', error);
    logger.error(
      `Error in handleSummarization:
      [message][${error.message}]
      [error][${error}]
      [sessionId] ${sessionId}
      [userId] ${userId},`,
      error
    );
    throw error;
  }
};
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
    logger.info(`Chat session found: ${chatSession._id}`);
    // logger.info(`MESSAGES: ${JSON.stringify(messages)}`);
    // Extract existing messageIds from the session
    const existingMessageIds = chatSession?.messages.map((msg) => msg.messageId);
    // Filter out messages that already exist in the session
    const newMessagesData = messages.filter(
      (message) => !existingMessageIds.includes(message.messageId)
    );
    // Iterate over each new message and create ChatMessage documents
    const newMessages = await Promise.all(
      newMessagesData.map(async (message) => {
        const newMessage = new Message({
          sessionId,
          type: message.role || 'message',
          data: {
            content: message.content,
            additional_kwargs: message.additional_kwargs || {},
          },
          assistantId: message.assistantId,
          userId: message.userId,
          messageId: null,
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
        logger.info(`Creating new message ${message.messageId} for session ${sessionId}`);
        logger.info(`New message data: ${JSON.stringify(newMessage)}`);
        logger.info(`Saving message ${message.messageId} to session ${sessionId}`);
        await newMessage.save();
        return newMessage;
      })
    );

    // Add new messages to the chat session
    chatSession.messages.push(...newMessages.map((msg) => msg._id));
    chatSession.stats.messageCount += newMessages.length;
    await chatSession.save();
    console.log(`Total messages in session ${sessionId}: ${chatSession.messages.length}`);
  } catch (error) {
    console.error('Error saving messages:', error.message);
    throw error;
  }
};

module.exports = {
  initializeOpenAI,
  initializePinecone,
  initializeEmbeddings,
  initializeChatHistory,
  initializeChatSession,
  handleSummarization,
  saveMessagesToSession,
};

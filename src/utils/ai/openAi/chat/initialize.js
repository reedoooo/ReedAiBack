// src/utils/chat.js
const { MongoDBChatMessageHistory } = require('@langchain/mongodb');
const { Pinecone } = require('@pinecone-database/pinecone');
const { summarizeMessages, extractSummaries } = require('./context.js');
const { OpenAIEmbeddings, ChatOpenAI } = require('@langchain/openai');
const { getOpenaiLangChainClient } = require('../get.js');
const { Message, ChatSession } = require('@/models');
const { logger } = require('@/config/logging/logger.js');

const initializeOpenAI = (apiKey, chatSession, completionModel) => {
  const configs = {
    modelName: completionModel,
    temperature: chatSession.settings.temperature,
    maxTokens: chatSession.settings.maxTokens,
    // streamUsage: true,
    streaming: true,
    openAIApiKey: apiKey || process.env.OPENAI_API_PROJECT_KEY,
    organization: 'reed_tha_human',
    tools: [
      {
        type: 'function',
        function: {
          name: 'summarize_messages',
          description:
            'Summarize a list of chat messages with an overall summary and individual message summaries including their IDs',
          parameters: {
            type: 'object',
            properties: {
              overallSummary: {
                type: 'string',
                description: 'An overall summary of the chat messages',
              },
              individualSummaries: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      description: 'The ID of the chat message',
                    },
                    summary: {
                      type: 'string',
                      description: 'A summary of the individual chat message',
                    },
                  },
                  required: ['id', 'summary'],
                },
              },
            },
            required: ['overallSummary', 'individualSummaries'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'fetchSearchResults',
          description:
            'Fetch search results for a given query using SERP API used to aid in being  PRIVATE INVESTIGATOR',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Query string to search for',
              },
            },
            required: ['query'],
          },
        },
      },
    ],
    // functions: {
    //   summarize_messages: {
    //     parameters: {
    //       type: 'object',
    //       properties: {
    //         summary: {
    //           type: 'string',
    //           description: 'A concise summary of the chat messages',
    //         },
    //       },
    //       required: ['summary'],
    //     },
    //   },
    // },
    code_interpreter: 'auto',
    function_call: 'auto',
  };
  return new ChatOpenAI(configs);
};

const initializePinecone = () => {
  return new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
};

const initializeEmbeddings = apiKey => {
  return new OpenAIEmbeddings({
    modelName: 'text-embedding-3-small',
    apiKey: apiKey || process.env.OPENAI_API_PROJECT_KEY,
    dimensions: 512,
  });
};

const initializeChatHistory = chatSession => {
  return new MongoDBChatMessageHistory({
    collection: Message.collection,
    sessionId: chatSession._id,
  });
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
      [sessionId] ${providedSessionId}
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
    chatSession.messages.push(...newMessages.map(msg => msg._id));
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
  handleSummarization,
  saveMessagesToSession,
};

// src/utils/chat.js
const { MongoDBChatMessageHistory } = require('@langchain/mongodb');
const { Pinecone } = require('@pinecone-database/pinecone');
const { summarizeMessages, extractSummaries } = require('./context.js');
const { OpenAIEmbeddings, ChatOpenAI } = require('@langchain/openai');
const { getOpenaiLangChainClient } = require('../get.js');
const { Message } = require('@/models');
const { logger } = require('@/config/logging/logger.js');

const initializeOpenAI = (apiKey, chatSession, completionModel) => {
  const configs = {
    modelName: completionModel,
    temperature: chatSession.settings.temperature,
    maxTokens: chatSession.settings.maxTokens,
    streamUsage: true,
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
  const summary = await summarizeMessages(messages.slice(-5), chatOpenAI);
  const { overallSummaryString, individualSummariesArray } = extractSummaries(summary);
  logger.info(`Overall Summary: ${overallSummaryString}`);
  logger.info(`Individual Summaries: ${JSON.stringify(individualSummariesArray)}`);
  return summary;
};

module.exports = {
  initializeOpenAI,
  initializePinecone,
  initializeEmbeddings,
  initializeChatHistory,
  handleSummarization,
};

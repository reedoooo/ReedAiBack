const { ChatOpenAI } = require('@langchain/openai');
const { default: OpenAI } = require('openai');

let clients = {};

const getOpenAIClient = async (clientKey, ClientClass, config) => {
  try {
    if (!clients[clientKey]) {
      clients[clientKey] = new ClientClass(config);
      console.log(`${clientKey} client initialized successfully`);
    }
    return clients[clientKey];
  } catch (error) {
    console.error(`Error initializing ${clientKey} client:`, error);
    throw error;
  }
};

const getDefaultOpenaiClient = async () => {
  return getOpenAIClient('defaultOpenAIClient', OpenAI, { apiKey: process.env.OPENAI_API_PROJECT_KEY });
};

const getUserOpenaiClient = async apiKey => {
  return getOpenAIClient('userOpenAIClient', OpenAI, { apiKey });
};

const getOpenaiClient = async configs => {
  return getOpenAIClient('openAIClient', OpenAI, configs);
};

const getOpenaiLangChainClient = configs => {
  return getOpenAIClient('openAILangChainClient', ChatOpenAI, configs);
};

// // Function to get Perplexity client
// const getPerplexityClient = async apiKey => {
//   return getOpenAIClient('perplexityClient', Perplexity, { apiKey });
// };

// // Function to get Gemini client
// const getGeminiClient = async apiKey => {
//   return getOpenAIClient('geminiClient', Gemini, { apiKey });
// };

module.exports = {
  getDefaultOpenaiClient,
  getUserOpenaiClient,
  getOpenaiClient,
  getOpenaiLangChainClient,
  // getPerplexityClient,
  // getGeminiClient,
};

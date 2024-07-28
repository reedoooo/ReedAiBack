const { ChatOpenAI } = require('@langchain/openai');
const { default: OpenAI } = require('openai');

const getDefaultOpenaiClient = async () => {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('OpenAI client initialized successfully');
    return client;
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
    throw error;
  }
};
const getUserOpenaiClient = async apiKey => {
  try {
    const client = new OpenAI({
      apiKey: apiKey,
    });
    console.log('OpenAI client initialized successfully');
    return client;
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
    throw error;
  }
};
const getOpenaiLangChainClient = () => {
  try {
    const client = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-3.5-turbo',
    });
    console.log('OpenAI LangChain client initialized successfully');
    return client;
  } catch (error) {
    console.error('Error initializing OpenAI LangChain client:', error);
    throw error;
  }
};
module.exports = {
  getDefaultOpenaiClient,
  getUserOpenaiClient,
};

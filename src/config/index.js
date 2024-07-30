/**
 * config/index.js
 */

const path = require('path');
const development = require('./env/development');
const test = require('./env/test');
const production = require('./env/production');
const logger = require('./logging');
const { getPineconeClient, getOpenaiLangChainClient, getOpenaiClient } = require('../utils');
require('dotenv').config();

const CHAT_SETTING_LIMITS = {
  // OPENAI MODELS
  'gpt-3.5-turbo': {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 2.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 4096,
    // MAX_CONTEXT_LENGTH: 16385 (TODO: Change this back to 16385 when OpenAI bumps the model)
  },
  'gpt-4-turbo-preview': {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 2.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 128000,
  },
  'gpt-4-vision-preview': {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 2.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 128000,
  },
  'gpt-4': {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 2.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 8192,
  },
  'gpt-4o': {
    MIN_TEMPERATURE: 0.0,
    MAX_TEMPERATURE: 2.0,
    MAX_TOKEN_OUTPUT_LENGTH: 4096,
    MAX_CONTEXT_LENGTH: 128000,
  },
};

const defaults = {
  root: path.normalize(__dirname + '/..'),
  api: {
    port: process.env.PORT || 3002,
    openAIKey: process.env.OPENAI_API_KEY,
    embeddingModel: process.env.EMBEDDING_MODEL,
    models: {
      gpt3: process.env.GPT3_MODEL,
      gpt4: process.env.GPT4_MODEL,
    },
    indexName: process.env.PINECONE_INDEX,
    namespace: process.env.PINECONE_NAMESPACE,
    dimension: process.env.PINECONE_DIMENSION,
    topK: process.env.PINECONE_TOP_K,
  },
  auth: {
    secret: process.env.AUTH_SECRET,
    audience: process.env.AUTH_AUDIENCE,
    issuer: process.env.AUTH_ISSUER,
  },
  chat: {
    settings: CHAT_SETTING_LIMITS,
  },
  // openai: getOpenaiClient(),
  // openaiLC: getOpenaiLangChainClient(),
  // pinecone: getPineconeClient(),
  // logger: logger,
  // db,
  // logger,
  // embedder: getEmbedding(),
};

/**
 * Expose
 */

module.exports = {
  development: Object.assign({}, development, defaults),
  test: Object.assign({}, test, defaults),
  production: Object.assign({}, production, defaults),
}[process.env.NODE_ENV || 'development'];

module.exports.logger = logger;

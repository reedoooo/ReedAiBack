/**
 * config/index.js
 */

const path = require('path');
const development = require('./env/development');
const test = require('./env/test');
const production = require('./env/production');
const logger = require('./logging');
const { getPineconeClient, getOpenaiLangChainClient, getOpenaiClient } = require('../utils');
const { CHAT_SETTING_LIMITS } = require('./constants');
require('dotenv').config();

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

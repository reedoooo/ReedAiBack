const { OpenAIEmbeddings } = require('@langchain/openai');
const axios = require('axios');
require('dotenv').config();

const vectorize = async text => {
  try {
    if (typeof text !== 'string' && !Array.isArray(text)) {
      throw new Error('Input to vectorize must be a string or an array of strings.');
    }
    console.log(`Sending input to OpenAI embeddings API: ${JSON.stringify(text)}`);

    const embedder = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      apiKey: process.env.OPENAI_API_PROJECT_KEY,
      dimensions: 512, // Use 512-dimensional embeddings
    });
    const response = await embedder.embedQuery(text);
    console.log(`Received response from OpenAI embeddings API: ${JSON.stringify(response)}`);
    return response;
  } catch (error) {
    console.error('Error vectorizing text:', error);
    throw error;
  }
};

module.exports = {
  vectorize,
};

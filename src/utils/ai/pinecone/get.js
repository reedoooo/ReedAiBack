const { Pinecone } = require('@pinecone-database/pinecone');
const { getEnv } = require('../../api');

const getPineconeClient = async () => {
  const client = new Pinecone({
    apiKey: getEnv('PINECONE_API_KEY'),
  });
  return client;
};

module.exports = { getPineconeClient };

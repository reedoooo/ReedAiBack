const { getEnv } = require('@/utils/api');
const { Pinecone } = require('@pinecone-database/pinecone');

const getPineconeClient = async () => {
  const client = new Pinecone({
    apiKey: getEnv('PINECONE_API_KEY'),
  });
  return client;
};

module.exports = { getPineconeClient };

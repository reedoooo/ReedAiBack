const logger = require('../../../config/logging/index');
const { getEnv } = require('../../api');
const { getPineconeClient } = require('./get');

const createPineconeIndex = async (pinecone, indexName, vectorDimension) => {
  console.log(`Checking "${indexName}"...`);
  const pinecones = await getPineconeClient();
  const indexList = await pinecones.listIndexes();
  const index = pinecones.Index(indexName);
  const indexCloud = getEnv('PINECONE_CLOUD');
  const indexRegion = getEnv('PINECONE_REGION');
  const indexNames = indexList.indexes.map(index => index.name);
  if (!indexNames.includes(indexName)) {
    await pinecones.createIndex({
      name: indexName,
      dimensions: 512,
      spec: {
        serverless: {
          cloud: indexCloud,
          region: indexRegion,
        },
      },
      waitUntilReady: true,
    });
    await new Promise(resolve => setTimeout(resolve, 60000));
    logger.info(`Index ${indexName} created successfully.`);
  } else {
    logger.info(`Index ${indexName} found.`);
  }
  return index;
};
module.exports = {
  createPineconeIndex,
};

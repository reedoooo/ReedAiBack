// const { Pinecone: PineconeClient, ServerlessSpecCloudEnum } = require('@pinecone-database/pinecone');
// const { PineconeStore } = require('@langchain/pinecone');
// const { OpenAIEmbeddings } = require('@langchain/openai');
// const { getEnv } = require('../../api/env');
// const { chunkedUpsert } = require('../../../../ignore/cleanup/cleanup/cleanup/diffUtils');
// const { v4: uuidv4 } = require('uuid');
// const logger = require('../../../config/logging/index');
// require('dotenv').config();

// const getPineconeClient = async () => {
//   try {
//     const client = new PineconeClient({
//       apiKey: getEnv('PINECONE_API_KEY'),
//     });
//     return client;
//   } catch (error) {
//     logger.error('Error initializing Pinecone client:', error);
//     throw error;
//   }
// };

// const createOrRetrievePineconeIndex = async indexName => {
//   const pinecone = await getPineconeClient();
//   const indexList = await pinecone.listIndexes();
//   const index = pinecone.Index(indexName);
//   const indexCloud = getEnv('PINECONE_CLOUD');
//   const indexRegion = getEnv('PINECONE_REGION');
//   logger.info(`=== DATA: ${JSON.stringify(index)} ===`);
//   logger.info(`ALL INDICES: ${JSON.stringify(indexList)}`);
//   const indexNames = indexList.indexes.map(index => index.name);
//   if (!indexNames.includes(indexName)) {
//     await pinecone.createIndex({
//       name: indexName,
//       dimension: getEnv('EMBEDDING_MODEL_DIMENSIONS'),
//       spec: {
//         serverless: {
//           cloud: indexCloud,
//           region: indexRegion,
//         },
//       },
//       waitUntilReady: true,
//     });
//     logger.info(`Index ${indexName} created successfully.`);
//   } else {
//     logger.info(`Index ${indexName} already exists.`);
//   }
//   return index;
// };

// const generateEmbeddings = async content => {
//   const embeddings = new OpenAIEmbeddings();
//   const result = await embeddings.embedDocuments([content]);
//   return result;
// };

// const storeEmbeddings = async (indexName, embeddings, namespace) => {
//   const pinecone = new PineconeClient({
//     apiKey: process.env.PINECONE_API_KEY,
//   });

//   await pinecone.upsert({
//     indexName,
//     vectors: embeddings.map((embedding, i) => ({
//       id: `${namespace}-${i}`,
//       values: embedding,
//     })),
//   });
// };

// const storeEmbeddingInPinecone = async (embedding, text, conversationId, indexName, namespace) => {
//   try {
//     const index = await createOrRetrievePineconeIndex(indexName);
//     const vectors = [
//       {
//         id: uuidv4(),
//         values: embedding,
//         metadata: { text, conversationId },
//       },
//     ];
//     await chunkedUpsert(index, vectors, namespace);
//     logger.info('Embedding stored in Pinecone successfully');
//   } catch (error) {
//     logger.error('Error storing embedding in Pinecone:', error);
//     throw error;
//   }
// };

// const fetchRelevantEmbeddings = async (queryEmbedding, topK = 5, indexName, namespace) => {
//   try {
//     const indexConfig = {
//       dimension: getEnv('EMBEDDING_MODEL_DIMENSIONS'),
//       metric: 'cosine',
//       spec: {
//         serverless: {
//           cloud: 'aws',
//           region: 'us-east-1',
//         },
//       },
//     };
//     const index = await createOrRetrievePineconeIndex(indexName, indexConfig);
//     const response = await index.namespace(namespace).query({
//       vector: queryEmbedding,
//       topK,
//       includeValues: true,
//       includeMetadata: true,
//       filter: {
//         metadata: {
//           conversationId: {
//             $exists: true,
//           },
//         },
//       },
//     });
//     logger.info('Relevant embeddings fetched successfully');
//     return response.matches;
//   } catch (error) {
//     logger.error('Error fetching relevant embeddings from Pinecone:', error);
//     throw error;
//   }
// };

// const queryPinecone = async query => {
//   const embeddings = new OpenAIEmbeddings();
//   const queryEmbedding = await embeddings.embedQuery(query);

//   const response = await pinecone.query({
//     indexName,
//     query: queryEmbedding,
//     topK: 5,
//   });

//   return response.matches.map(match => match.metadata);
// };

// module.exports = {
//   getPineconeClient,
//   createOrRetrievePineconeIndex,
//   generateEmbeddings,
//   storeEmbeddings,
//   storeEmbeddingInPinecone,
//   fetchRelevantEmbeddings,
//   queryPinecone,
// };

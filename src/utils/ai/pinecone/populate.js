const { Document } = require('langchain/document');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

async function populateVectorStore(content) {
  try {
    if (!vectorStore) {
      await initializeVectorStore();
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.createDocuments([content]);
    await vectorStore.addDocuments(docs);
    logger.info('Vector store populated successfully');
  } catch (error) {
    logger.error('Error populating vector store:', error);
    throw error;
  }
}

module.exports = { populateVectorStore };

const { PineconeStore } = require('@langchain/pinecone');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { getPineconeClient } = require('./get');
const { scrapeContent } = require('@/utils/processing/utils');
const { logger } = require('@/config/logging');
const fs = require('fs');
const path = require('path');
const { File } = require('@/models');

const upsertDocs = async (req, res) => {
  const { url, library, folderId, workspaceId } = req.body;

  try {
    // Validate input
    if (!url || !library) {
      throw new Error('URL and library are required fields.');
    }

    logger.info(`BODY: ${JSON.stringify(req.body)}`);

    // Scrape content
    let content;
    try {
      content = await scrapeContent(url);
    } catch (error) {
      throw new Error('Failed to scrape content: ' + error.message);
    }

    // Define file path and name
    const fileName = `scraped_${library}_${Date.now()}.txt`;
    const filePath = path.join(__dirname, '../../../../public/uploads', fileName);

    // Write the scraped content to a file
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      logger.info(`Content saved to ${filePath}`);
    } catch (error) {
      throw new Error('Failed to write file: ' + error.message);
    }

    // Get file stats
    let fileStats;
    try {
      fileStats = fs.statSync(filePath);
    } catch (error) {
      throw new Error('Failed to get file stats: ' + error.message);
    }

    const fileType = path.extname(fileName).slice(1);

    // Save file information to MongoDB
    try {
      const newFile = new File({
        userId: req.userId,
        workspaceId: workspaceId,
        folderId: folderId,
        name: fileName,
        size: fileStats.size,
        originalFileType: fileType,
        filePath: filePath,
        type: fileType,
        metadata: {
          fileSize: fileStats.size,
          fileType: fileType,
          lastModified: fileStats.mtime,
        },
      });
      logger.info('Creating new file entry in MongoDB...');
      await newFile.save();
      logger.info('File information saved to MongoDB');
    } catch (error) {
      throw new Error('Failed to save file information to MongoDB: ' + error.message);
    }

    // Initialize OpenAI embeddings
    let embedder;
    try {
      embedder = new OpenAIEmbeddings({
        modelName: 'text-embedding-3-small',
        apiKey: process.env.OPENAI_API_PROJECT_KEY,
        dimensions: 512,
      });
    } catch (error) {
      throw new Error('Failed to initialize OpenAI embeddings: ' + error.message);
    }

    // Get Pinecone client
    let pinecone;
    try {
      pinecone = await getPineconeClient();
    } catch (error) {
      throw new Error('Failed to get Pinecone client: ' + error.message);
    }

    // Get Pinecone index
    let pineconeIndex;
    try {
      pineconeIndex = await pinecone.Index(process.env.PINECONE_INDEX);
    } catch (error) {
      throw new Error('Failed to get Pinecone index: ' + error.message);
    }

    // Create Pinecone store
    let vstore;
    try {
      vstore = await PineconeStore.fromExistingIndex(embedder, {
        pineconeIndex,
        namespace: 'library-documents',
        textKey: 'text',
      });
    } catch (error) {
      throw new Error('Failed to create Pinecone store: ' + error.message);
    }

    // Split text into documents
    let docs;
    try {
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      docs = await textSplitter.createDocuments([content], [{ source: library }]);
    } catch (error) {
      throw new Error('Failed to split text into documents: ' + error.message);
    }

    // Upsert documents into Pinecone
    try {
      logger.info(`Upserting ${docs.length} chunks from ${url}...`);
      await vstore.addDocuments(docs);
    } catch (error) {
      throw new Error('Failed to upsert documents into Pinecone: ' + error.message);
    }

    res.status(200).send(`Successfully upserted ${docs.length} documents from ${url}`);
  } catch (error) {
    logger.error(error);
    res.status(500).send('Error upserting documentation: ' + error.message);
  }
};

module.exports = { upsertDocs };

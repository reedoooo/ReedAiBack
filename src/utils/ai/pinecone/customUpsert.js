const { PineconeStore } = require('@langchain/pinecone');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { getPineconeClient } = require('./get');
const { scrapeContent } = require('@/utils/processing/utils');
const { logger } = require('@/config/logging');

const upsertDocs = async (req, res) => {
  const { url, library } = req.body;

  try {
    const content = await scrapeContent(url);
		const embedder = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      apiKey: process.env.OPENAI_API_PROJECT_KEY,
      dimensions: 512, // Use 512-dimensional embeddings
    });
    const pinecone = await getPineconeClient();
		const pineconeIndex = await pinecone.Index(process.env.PINECONE_INDEX);
		const vstore = await PineconeStore.fromExistingIndex(embedder, {
			pineconeIndex,
			namespace: 'library-documents',
			textKey: 'text',
		});
		const textSplitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200,
		});

		const docs = await textSplitter.createDocuments([content], [{ source: library }]);

		logger.info(`Upserting ${docs.length} chunks from ${url}...`);
		await vstore.addDocuments(docs);
    // await pinecone.upsertDocs({
    //   namespace: 'library-documents',
    //   vectors: [{ id: `${library}-${Date.now()}`, values: vector }],
    // });

    res.status(200).send('Documentation upserted successfully.');
  } catch (error) {
    logger.error(error);
    res.status(500).send('Error upserting documentation.');
  }
};

module.exports = { upsertDocs };

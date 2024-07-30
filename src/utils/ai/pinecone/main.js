// 1. Initialize a new project with: npm init -y, and create an 4 js files .env file
// 2. npm i "@pinecone-database/pinecone@^0.0.10" dotenv@^16.0.3 langchain@^0.0.73
// 3. Obtain API key from OpenAI (https://platform.openai.com/account/api-keys)
// 4. Obtain API key from Pinecone (https://app.pinecone.io/)
// 5. Enter API keys in .env file
// Optional: if you want to use other file loaders (https://js.langchain.com/docs/modules/indexes/document_loaders/examples/file_loaders/)

const { DirectoryLoader } = require('langchain/document_loaders/fs/directory');
const { TextLoader } = require('langchain/document_loaders/fs/text');
const { Pinecone } = require('@pinecone-database/pinecone');
const { createPineconeIndex } = require('./create.js');
const { updatePinecone } = require('./update.js');
const { queryPineconeVectorStoreAndQueryLLM } = require('./query.js');
const { PDFLoader } = require('@langchain/community/document_loaders/fs/pdf');
const { getEnv } = require('../../api/env.js');
const { CSVLoader } = require('@langchain/community/document_loaders/fs/csv');
const path = require('path');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { processDocument } = require('../../processing/utils/main.js');

require('dotenv').config();

const publicFilesDirectory = path.join(__dirname, '../../../../public/files');
// 7. Set up DirectoryLoader to load documents from the ./documents directory
const loader = new DirectoryLoader(publicFilesDirectory, {
  '.txt': path => new TextLoader(path),
  '.pdf': path => new PDFLoader(path),
  '.csv': path => new CSVLoader(path),
  '.docx': path => new DocxLoader(path),
  '.json': path => new JSONLoader(path),
  '.md': path => new MarkdownLoader(path),
  // '.html': (path) => new HTMLLoader(path),
  // '.js': (path) => new JavascriptLoader(path)
});

const chatCompletionWithLLM = async data => {
  const { prompt: prompt, apiKey: apiKey } = data;

  try {
    const pinecone = new Pinecone({
      apiKey: getEnv('PINECONE_API_KEY'),
    });

    await createPineconeIndex(pinecone, getEnv('PINECONE_INDEX'), 512);

    const docs = await loader.load();
    const processedDocs = await Promise.all(docs.map(processDocument));
    const flattenedDocs = processedDocs.flat();

    const embeddings = new OpenAIEmbeddings({
      apiKey: getEnv('OPENAI_API_KEY') || process.env.OPENAI_API_KEY,
      dimensions: 512, // Ensure dimensions are passed as an integer
      model: getEnv('EMBEDDING_MODEL') || process.env.EMBEDDING_MODEL,
    });
    await updatePinecone(pinecone, getEnv('PINECONE_INDEX'), flattenedDocs, embeddings);

    await queryPineconeVectorStoreAndQueryLLM(pinecone, getEnv('PINECONE_INDEX'), question, embeddings);
  } catch (error) {
    console.error('An error occurred:', error);
  }
};
module.exports = { chatCompletionWithLLM };
// const main = async () => {
//   try {
//     const pinecone = new Pinecone({
//       apiKey: getEnv('PINECONE_API_KEY'),
//     });

//     await createPineconeIndex(pinecone, getEnv('PINECONE_INDEX'), 512);

//     const docs = await loader.load();
//     const processedDocs = await Promise.all(docs.map(processDocument));
//     const flattenedDocs = processedDocs.flat();

//     const embeddings = new OpenAIEmbeddings({
// 			apiKey: getEnv('OPENAI_API_KEY') || process.env.OPENAI_API_KEY,
//       dimensions: 512,  // Ensure dimensions are passed as an integer
// 			model: getEnv('EMBEDDING_MODEL') || process.env.EMBEDDING_MODEL,
// 		 });
//     await updatePinecone(pinecone, getEnv('PINECONE_INDEX'), flattenedDocs, embeddings);

//     const question = 'When is mr Gatsby?';
//     await queryPineconeVectorStoreAndQueryLLM(pinecone, getEnv('PINECONE_INDEX'), question, embeddings);
//   } catch (error) {
//     console.error('An error occurred:', error);
//   }
// };

// main();

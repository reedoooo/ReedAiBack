const { encode } = require('gpt-tokenizer');
const { CSVLoader } = require('@langchain/community/document_loaders/fs/csv');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { CHUNK_SIZE, CHUNK_OVERLAP } = require('@/config/constants');

const processCSV = async csv => {
  const loader = new CSVLoader(csv);
  const docs = await loader.load();
  let completeText = docs.map(doc => doc.pageContent).join('\n\n');

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ['\n\n'],
  });
  const splitDocs = await splitter.createDocuments([completeText]);

  let chunks = [];

  for (let i = 0; i < splitDocs.length; i++) {
    const doc = splitDocs[i];

    chunks.push({
      content: doc.pageContent,
      tokens: encode(doc.pageContent).length,
    });
  }

  return chunks;
};

module.exports = { processCSV };

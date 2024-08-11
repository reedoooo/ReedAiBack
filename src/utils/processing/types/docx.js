const { encode } = require('gpt-tokenizer');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { CHUNK_SIZE, CHUNK_OVERLAP } = require('@/config/constants');

const processDocX = async text => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });
  const splitDocs = await splitter.createDocuments([text]);

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

module.exports = { processDocX };

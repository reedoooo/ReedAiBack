const { TokenTextSplitter } = require('langchain/text_splitter');
const { escapeRegExp } = require('./text');

const containsDiff = message => {
  return message.includes('<<<<<<< ORIGINAL') && message.includes('>>>>>>> UPDATED') && message.includes('=======\n');
};

const applyDiff = (code, diff) => {
  const regex = /<<<<<<< ORIGINAL\n(.*?)=======\n(.*?)>>>>>>> UPDATED/gs;
  let match;
  while ((match = regex.exec(diff)) !== null) {
    const [, before, after] = match;
    let regex = escapeRegExp(before);
    regex = regex.replaceAll(/\r?\n/g, '\\s+');
    regex = regex.replaceAll(/\t/g, '');
    const replaceRegex = new RegExp(regex);
    code = code.replace(replaceRegex, after);
  }
  return code;
};

const sliceIntoChunks = (arr, chunkSize) =>
  Array.from({ length: Math.ceil(arr.length / chunkSize) }, (_, i) => arr.slice(i * chunkSize, (i + 1) * chunkSize));

const chunkedUpsert = async (index, vectors, namespace, chunkSize = 10) => {
  const chunks = sliceIntoChunks(vectors, chunkSize);
  try {
    await Promise.allSettled(
      chunks.map(async chunk => {
        try {
          await index.namespace(namespace).upsert(chunk);
        } catch (e) {
          console.log('Error upserting chunk', e);
        }
      })
    );
    return true;
  } catch (e) {
    throw new Error(`Error upserting vectors into index: ${e}`);
  }
};

const extractContent = chunk => {
  return chunk.choices[0]?.delta?.content || '';
};

const processChunkBatch = async chunks => {
  try {
    // maps each chunk to its content and joins them into a single string
    const batchContent = chunks
      .map(chunk => {
        const chunkContent = extractContent(chunk);
        return chunkContent;
      })
      .join('');

    return batchContent;
  } catch (error) {
    console.error('Error processing chunk batch:', error);
  }
};

function semanticChunking(text, chunkSize = 1000, overlap = 200) {
  const splitter = new TokenTextSplitter({
    chunkSize: chunkSize,
    chunkOverlap: overlap,
  });

  return splitter.splitText(text);
}

function slidingWindowChunks(chunks, windowSize = 3) {
  const windows = [];
  for (let i = 0; i < chunks.length - windowSize + 1; i++) {
    windows.push(chunks.slice(i, i + windowSize).join(' '));
  }
  return windows;
}

module.exports = {
  containsDiff,
  applyDiff,
  sliceIntoChunks,
  chunkedUpsert,
  processChunkBatch,
  extractContent,
  semanticChunking,
  slidingWindowChunks,
};

const { extractContent, parseContent } = require('../../processing');

// --- RESPONSE HANDLER ---
class StreamResponseHandler {
  constructor() {
    this.fullResponse = '';
    this.parsedChunks = [];
  }

  handleChunk(chunk) {
    const content = extractContent(chunk);
    this.fullResponse += content;
    const parsedChunkContent = parseContent(content);
    this.parsedChunks.push(parsedChunkContent);
    return content;
  }

  isResponseComplete() {
    try {
      JSON.parse(this.fullResponse);
      return true;
    } catch {
      return false;
    }
  }

  getFullResponse() {
    return this.fullResponse;
  }

  getParsedChunks() {
    return this.parsedChunks;
  }
}

module.exports = {
  StreamResponseHandler,
};

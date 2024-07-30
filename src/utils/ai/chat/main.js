const constructChatCompletionStreamResponse = (answerID, answer) => {
  return {
    id: answerID,
    choices: [
      {
        index: 0,
        delta: { content: answer },
      },
    ],
  };
};

const constructCustomChatCompletionStreamResponse = (uuid, answer) => {
  return {
    id: uuid,
    object: 'text_completion',
    created: Date.now(),
    choices: [
      {
        index: 0,
        text: answer,
        finish_reason: 'stop',
      },
    ],
  };
};

const NewChatCompletionRequest = (chatSession, chatMessages, chatFiles) => {
  const messages = chatMessages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  return {
    model: chatSession.model,
    messages,
    temperature: chatSession.temperature,
    max_tokens: chatSession.maxTokens,
    top_p: chatSession.topP,
    n: chatSession.n,
    stream: true,
  };
};

const getModelBaseUrl = apiUrl => {
  if (apiUrl === 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions') {
    return 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  }

  const parsedUrl = new URL(apiUrl);
  const pathParts = parsedUrl.pathname.split('/');
  const version = pathParts[2] || '';
  return `${parsedUrl.protocol}//${parsedUrl.host}/${version}`;
};

const isString = obj => typeof obj === 'string';

const sliceIntoChunks = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

class Embedder {
  constructor() {
    this.pipe = null;
  }

  async init(modelName) {
    const { pipeline, AutoConfig } = await import('@xenova/transformers');
    const config = await AutoConfig.from_pretrained(modelName);
    this.pipe = pipeline('embeddings', modelName, {
      quantized: false,
      config,
    });
  }

  async embed(text, metadata) {
    try {
      const { randomUUID } = await import('crypto');
      const result = await this.pipe(text, {
        pooling: 'mean',
        normalize: true,
      });
      const id = metadata?.id || randomUUID();
      return {
        id,
        metadata: metadata || {
          text,
        },
        values: Array.from(result.data),
      };
    } catch (e) {
      console.log(`Error embedding text: ${text}, ${e}`);
      throw e;
    }
  }

  async embedBatch(documents, batchSize, onDoneBatch) {
    const batches = sliceIntoChunks(documents, batchSize);
    for (const batch of batches) {
      const embeddings = await Promise.all(
        batch.map(documentOrString =>
          isString(documentOrString)
            ? this.embed(documentOrString)
            : this.embed(documentOrString.pageContent, documentOrString.metadata)
        )
      );
      await onDoneBatch(embeddings);
    }
  }
}

class TransformersJSEmbedding {
  constructor(params) {
    this.modelName = params.modelName;
    this.pipe = null;
  }

  async embedDocuments(texts) {
    const { pipeline } = await import('@xenova/transformers');
    this.pipe = this.pipe || (await pipeline('embeddings', this.modelName));

    const embeddings = await Promise.all(texts.map(async text => this.embedQuery(text)));
    return embeddings;
  }

  async embedQuery(text) {
    const { pipeline } = await import('@xenova/transformers');
    this.pipe = this.pipe || (await pipeline('embeddings', this.modelName));

    const result = await this.pipe(text);
    return Array.from(result.data);
  }
}

const embedder = new Embedder();

module.exports = {
  constructChatCompletionStreamResponse,
  constructCustomChatCompletionStreamResponse,
  NewChatCompletionRequest,
  getModelBaseUrl,
  Embedder,
  TransformersJSEmbedding,
  embedder,
};

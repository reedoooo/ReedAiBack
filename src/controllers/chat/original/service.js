const { default: OpenAI } = require('openai');
const { PineconeStore } = require('@langchain/pinecone');
const { OpenAIEmbeddings, ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { MongoClient } = require('mongodb');
const { getEnv, getServerProfile, checkApiKey, createOrRetrievePineconeIndex } = require('../../../utils');
const logger = require('../../../config/logging/index.js');

async function addEntry({ entry, speaker, userId }) {
  const client = new MongoClient('mongodb://localhost:27017', { useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db('yourDatabaseName');
    const conversations = db.collection('conversations');

    await conversations.insertOne({ user_id: userId, entry, speaker });
  } catch (e) {
    logger.error(`Error adding entry: ${e}`);
  } finally {
    await client.close();
  }
}

async function getConversation({ limit, userId }) {
  const client = new MongoClient('mongodb://localhost:27017', { useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db('yourDatabaseName');
    const conversations = db.collection('conversations');

    const conversation = await conversations.find({ user_id: userId }).sort({ created_at: -1 }).limit(limit).toArray();

    return conversation.map(entry => `${entry.speaker.toUpperCase()}: ${entry.entry}`).reverse();
  } catch (e) {
    logger.error(`Error getting conversation: ${e}`);
    return [];
  } finally {
    await client.close();
  }
}

function buildBasePrompt(prompt, profileContext, workspaceInstructions, assistant) {
  let fullPrompt = '';

  if (assistant) {
    fullPrompt += `<INJECT ROLE>\nYou are not an AI. You are ${assistant.name}.\n</INJECT ROLE>\n\n`;
  }

  fullPrompt += `Today is ${new Date().toLocaleDateString()}.\n\n`;

  if (profileContext) {
    fullPrompt += `User Info:\n${profileContext}\n\n`;
  }

  if (workspaceInstructions) {
    fullPrompt += `System Instructions:\n${workspaceInstructions}\n\n`;
  }

  fullPrompt += `User Instructions:\n${prompt}`;

  return fullPrompt;
}

const withChatCompletion = async (user, userPrompt, conversationId, sessionUuid, role, clientApiKey) => {
  try {
    const session = sessionUuid.sessionUuid;
    const indexName = getEnv('PINECONE_INDEX');
    const namespace = session;
    const dimension = 512;
    const openai = new OpenAI({
      apiKey: clientApiKey || process.env.OPENAI_API_KEY,
      model: 'gpt-3.5-turbo',
      stream: true,
    });
    const embedder = new OpenAIEmbeddings({
      apiKey: clientApiKey || process.env.OPENAI_API_KEY,
      modelName: getEnv('EMBEDDING_MODEL_NAME'),
      dimensions: dimension,
    });
    const currentEmbedding = await embedder.embedQuery(userPrompt);
    logger.info(`PINECONE CURRENT EMBEDDING: ${JSON.stringify(currentEmbedding)}`);

    const pineconeIndex = await createOrRetrievePineconeIndex(indexName);
    logger.info(`PINECONE INDEX: ${JSON.stringify(pineconeIndex)}`);
    const vectorStore = await PineconeStore.fromExistingIndex(embedder, { pineconeIndex, namespace });
    logger.info(`PINECONE VECTOR STORE: ${JSON.stringify(vectorStore)}`);
    const relevantEmbeddings = await vectorStore.similaritySearchVectorWithScore(currentEmbedding, 5);
    logger.info(`RELEVANT EMBEDDINGS WITH SCORES: ${JSON.stringify(relevantEmbeddings)}`);
    const previousMessages = relevantEmbeddings.map(match => match.pageContent).join(' ');
    logger.info(`PINECONE PREVIOUS MESSAGES: ${previousMessages}`);
    const promptTemplate = new PromptTemplate({
      template: `${userPrompt}\n\n${previousMessages}`,
      inputVariables: ['previousMessages', 'userPrompt'],
    });
    const formattedPrompt = await promptTemplate.format({ previousMessages, userPrompt });
    logger.info(`FORMATTED PROMPT: ${formattedPrompt}`);
    const messages = [
      { role: 'system', content: 'You are a helpful assistant that can interpret and execute code snippets.' },
      {
        role: 'assistant',
        content:
          'You are an AI programming assistant. Follow the users requirements carefully and to the letter. First, think step-by-step and describe your plan for what to build in pseudocode, written out in great detail. Then, output the code in a single code block. Minimize any other prose.',
      },
      {
        role: 'user',
        content: `Please interpret, fix, complete, and/or style and then run the following code request:\n\n${formattedPrompt}`,
      },
    ];
    const completion = await openai.chat.completions.create({
      messages: messages,
      model: 'gpt-4',
      response_format: { type: 'json_object' },
      stream: true,
      // max_tokens: 2000,
    });
    logger.info(`Stream initialized`);

    const docs = [{ pageContent: userPrompt, metadata: { conversationId, session, role } }];
    logger.info(`DOCS: ${JSON.stringify(docs)}`);
    await vectorStore.addDocuments(docs, { namespace });
    logger.info('Chat completion created successfully');
    return stream;
  } catch (error) {
    logger.error('Error in withChatCompletion:', error);
    throw error;
  }
};

async function processStream(stream, res) {
  try {
    for await (const chunk of stream) {
      if (chunk.object === 'chat.completion.chunk') {
        const content = chunk.choices[0]?.delta?.content || '';
        logger.info('Received chunk:', content);
        const message = JSON.stringify(chunk.choices[0]?.delta || '');
        res.write(`data: ${message}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
  } catch (error) {
    logger.error(`Stream processing error: ${error}`);
    throw error;
  }
}

module.exports = {
  addEntry,
  getConversation,
  buildBasePrompt,
  withChatCompletion,
  processStream,
};

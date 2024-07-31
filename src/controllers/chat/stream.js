const { User, Model, ChatFile, ChatSession, Message } = require('../../models/index.js');
const { initializeChatSession, getSessionMessages, createMessage } = require('../../models/utils/index.js');
// const { default: OpenAI } = require('openai');
const { PineconeStore } = require('@langchain/pinecone');
const { OpenAIEmbeddings, ChatOpenAI, OpenAI } = require('@langchain/openai');
const { PromptTemplate, ChatPromptTemplate, HumanMessagePromptTemplate } = require('@langchain/core/prompts');
// const {
//   getEnv,
//   checkApiKey,
//   createPineconeIndex,
//   extractContent,
//   processChunkBatch,
//   parseContent,
// } = require('../../utils/index.js');
const logger = require('../../config/logging/index.js');
const { Pinecone } = require('@pinecone-database/pinecone');
const { MongoDBChatMessageHistory } = require('@langchain/mongodb');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');
const { TokenTextSplitter, RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { checkApiKey } = require('../../utils/auth/user.js');
const { getEnv } = require('../../utils/api/env.js');
const { createPineconeIndex } = require('../../utils/ai/pinecone/create.js');
const { extractContent, parseContent } = require('../../utils/processing/index.js');

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

// --- PROMPT TEMPLATE ---
const buildPromptFromTemplate = async (summary, prompt) => {
  try {
    const tempObj = {
      input: `Please respond to the following prompt: ${prompt}`,
    };
    const promptTemplate = new PromptTemplate({
      template: tempObj.input,
      inputVariables: ['summary', 'prompt'],
    });
    return promptTemplate.format();
  } catch (error) {
    throw new Error(`Error building prompt from template: ${error.message}`);
  }
};
function isCodeRelated(summary) {
  const codeKeywords = ['code', 'program', 'function', 'variable', 'syntax', 'algorithm'];
  return codeKeywords.some(keyword => summary.includes(keyword));
}

// --- SUMMARIZE MESSAGES ---
async function summarizeMessages(messages, openai) {
  const summarizeFunction = {
    name: 'summarize_messages',
    description: 'Summarize a list of chat messages',
    parameters: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'A concise summary of the chat messages',
        },
      },
      required: ['summary'],
    },
  };

  const response = await openai.completionWithRetry({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant that summarizes chat messages.' },
      {
        role: 'user',
        content: `Summarize these messages. Give an overview of each message: ${JSON.stringify(messages)}`,
      },
    ],
    functions: [summarizeFunction],
    function_call: { name: 'summarize_messages' },
  });

  const functionCall = response.choices[0].message.function_call;
  if (functionCall && functionCall.name === 'summarize_messages') {
    return JSON.parse(functionCall.arguments).summary;
  }
  return 'Unable to generate summary';
}

// --- MAIN FUNCTION ---
const withChatCompletion = async data => {
  const { apiKey, pineconeIndex, completionModel, namespace, prompt, sessionId, userId, role, stream, res } = data;

  try {
    // [INIT SESSION]
    const chatSession = await initializeChatSession(sessionId, userId);
    // [INIT OPENAI]
    const chatOpenAI = new ChatOpenAI({
      modelName: completionModel,
      temperature: chatSession.settings.temperature,
      maxTokens: chatSession.settings.maxTokens,
      topP: chatSession.settings.topP,
      n: chatSession.settings.n,
      streaming: true,
      openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
      organization: 'reed_tha_human',
      functions: {
        summarize_messages: {
          parameters: {
            type: 'object',
            properties: {
              summary: {
                type: 'string',
                description: 'A concise summary of the chat messages',
              },
            },
            required: ['summary'],
          },
        },
      },
      function_call: 'auto',
    });
    // [INIT PINECONE]
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    // [INIT LANGCHAIN EMBEDDINGS]
    const embedder = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      apiKey: apiKey || process.env.OPENAI_API_KEY,
      dimensions: 512, // Use 512-dimensional embeddings
    });
    // [MONGODB HISTORY INIT]
    const chatHistory = new MongoDBChatMessageHistory({
      collection: Message.collection, // Use your existing Message collection
      sessionId: chatSession._id,
    });
    // [GET SESSION MESSAGES]
    const messages = (await getSessionMessages(chatSession._id)) || [];
    // [SUMMARIZE MESSAGES]
    const summary = await summarizeMessages(messages.slice(-5), chatOpenAI);
    logger.info(`SUMMARY: ${summary}`);
    await chatHistory.addUserMessage(prompt);
    const newUserMessageId = await createMessage(
      chatSession._id,
      'user',
      prompt,
      userId,
      chatSession.messages.length + 1
    );
    chatSession.messages.push(newUserMessageId);
    await chatSession.save();
    // [PINECONE VECTOR STORE SETUP]
    const vectorStore = await PineconeStore.fromExistingIndex(embedder, {
      pineconeIndex: await createPineconeIndex(pinecone, pineconeIndex),
      namespace: 'library-documents',
      textKey: 'text',
    });
    // [PINECONE QUERY]
    const relevantDocs = await vectorStore.similaritySearch(prompt, 5);
    logger.info(`Relevant Docs: ${JSON.stringify(relevantDocs)}`, relevantDocs);
    const context = relevantDocs.map(doc => doc.pageContent).join('\n');
    logger.info(`Context: ${context}`);
    // [PROMPT TEMPLATE SETUP]
    const promptTemplate = new PromptTemplate({
      template: 'Context: {context}\n\nSummary of previous messages: {summary}\n\nUser: {prompt}\nAI:',
      inputVariables: ['context', 'summary', 'prompt'],
    });
    const formattedPrompt = await promptTemplate.format({ context, summary, prompt });
    logger.info(`Formatted Prompt: ${formattedPrompt}`);
    // [STREAM RESPONSE HANDLER]
    const responseHandler = new StreamResponseHandler();
    // [CHAT OPENAI COMPLETION]
    const result = await chatOpenAI.completionWithRetry({
      model: completionModel,
      messages: [...messages, { role: 'user', content: formattedPrompt }],
      stream: true,
      response_format: { type: 'json_object' },
    });
    logger.info(`Chat RESULT: ${JSON.stringify(result)}`, result);

    for await (const chunk of result) {
      res.flushHeaders();
      const chunkContent = await responseHandler.handleChunk(chunk);
      res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);

      if (responseHandler.isResponseComplete()) {
        const fullResponse = responseHandler.getFullResponse();
        logger.debug(`fullResponse fullResponse: ${JSON.stringify(fullResponse)}`, fullResponse);

        const assistantMessageId = await createMessage(
          chatSession._id,
          'assistant',
          fullResponse,
          userId,
          chatSession.messages.length + 1
        );
        chatSession.messages.push(assistantMessageId);
        await chatSession.save();

        // Add the interaction to the vector store
        const docs = [
          { pageContent: prompt, metadata: { chatId: sessionId, role: 'user' } },
          { pageContent: fullResponse, metadata: { chatId: sessionId, role: 'assistant' } },
        ];
        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });
        const splitDocs = await textSplitter.splitDocuments(docs);
        await vectorStore.addDocuments(splitDocs);
      }
    }
  } catch (error) {
    logger.error('Error in withChatCompletion:', error);
    throw error;
  }
};

// --- CHAT STREAM ---
const chatStream = async (req, res) => {
  logger.info(`REQUEST BODY: ${JSON.stringify(req.body)}`);
  const { sessionId, chatId, prompt, userId, clientApiKey, role } = req.body;
  const initializationData = {
    apiKey: clientApiKey || process.env.OPENAI_API_KEY,
    pineconeIndex: getEnv('PINECONE_INDEX'),
    namespace: getEnv('PINECONE_NAMESPACE'),
    embeddingModel: getEnv('EMBEDDING_MODEL'),
    dimensions: parseInt(getEnv('EMBEDDING_MODEL_DIMENSIONS')),
    completionModel: getEnv('OPENAI_CHAT_COMPLETION_MODEL_2'),
    temperature: 0.5,
    maxTokens: 1024,
    topP: 1,
    frequencyPenalty: 0.5,
    presencePenalty: 0,
    prompt,
    chatId,
    sessionId,
    userId,
    role,
    res,
  };

  try {
    checkApiKey(clientApiKey, 'OpenAI');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.flushHeaders();
    await withChatCompletion(initializationData);
  } catch (error) {
    logger.error(`Error in chatStream: ${error}`);
    if (!res.headersSent) {
      res.status(500).json({ error: 'An error occurred while processing the chat stream' });
    }
  } finally {
    res.write('data: [DONE]\n\n');
    res.end();
  }
};

// --- EXPORT ---
module.exports = {
  chatStream,
};
/*
    if (isCodeRelated(summary)) {
      // [PINECONE VECTOR STORE SETUP]
      const vectorStore = await PineconeStore.fromExistingIndex(embedder, {
        pineconeIndex: await createPineconeIndex(pinecone, pineconeIndex),
        namespace: namespace,
        textKey: 'text',
      });
      // [CHUNKING AND EMBEDDING]
      const processPrompt = async prompt => {
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 100,
        });
        const splitDocs = await splitter.createDocuments([prompt]);
        let chunks = [];

        for (let i = 0; i < splitDocs.length; i++) {
          const doc = splitDocs[i];

          chunks.push({
            content: doc,
          });
        }

        return chunks;
      };
      const processedPrompt = await processPrompt(prompt);
      const embedding = await embedder.embedQuery(processedPrompt);
      // [PINECONE DOCUMENT UPDATING]
      const vector = {
        id: `doc_${i}`,
        values: embedding,
        metadata: {
          content: prompt,
        },
      };
      await vectorStore.addVectors([vector], { namespace });
      // [PINECONE QUERY]
      const queryResult = await pinecone.Index(getEnv('PINECONE_INDEX')).query({
        namespace: namespace,
        vector: await embedder.embedQuery(prompt),
        topK: 10,
      });
      console.log(`Found ${queryResult.matches.length} matches...`);
      console.log(`Asking question: ${prompt}...`);
      logger.info(`PINECONE QUERY RESULT: ${JSON.stringify(queryResult)}`);
      // [PINECONE ANSWERING QUESTIONS]
      if (queryResponse.matches.length) {
        const concatenatedPageContent = queryResult.matches.map(match => match.metadata.content).join(' ');
        const result = await chatOpenAI.completionWithRetry({
          model: completionModel,
          messages: [
            { role: 'system', content: 'You are a helpful assistant that answers questions about code.' },
            { role: 'user', content: `Ask a question about this code: ${concatenatedPageContent}` },
          ],
        });

        if (result.choices[0].message.content) {
          console.log(`Answer: ${result.choices[0].message.content}`);
        } else {
          console.log('No answer found.');
        }
      }
      // [PINECONE DOCUMENT UPDATING]
      const docs = [{ pageContent: prompt, metadata: { chatId: sessionId, chatSession, role } }];
      const flattenedDocs = docs.flat();
      await vectorStore.addDocuments(docs, { namespace });
    }
*/

const { Pinecone } = require('@pinecone-database/pinecone');
const { MongoDBChatMessageHistory } = require('@langchain/mongodb');
const { TokenTextSplitter, RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { PineconeStore } = require('@langchain/pinecone');
const { OpenAIEmbeddings, ChatOpenAI, OpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { User, Model, ChatFile, ChatSession, Message } = require('../../../models');
const { initializeChatSession, getSessionMessages, createMessage } = require('../../../models/utils/index.js');
const logger = require('../../../config/logging/index.js');
const { checkApiKey } = require('../../../utils/auth/user.js');
const { getEnv } = require('../../../utils/api/env.js');
const { createPineconeIndex } = require('../../../utils/ai/pinecone/create.js');
const { summarizeMessages } = require('./context.js');
const { StreamResponseHandler } = require('./handlers.js');

// --- MAIN FUNCTION ---
const streamWithCompletion = async data => {
  const {
		apiKey,
		pineconeIndex,
		namespace,
		embeddingModel,
		dimensions,
		completionModel,
		temperature,
		maxTokens,
		topP,
		frequencyPenalty,
		presencePenalty,
		prompt,
		providedWorkspaceId,
		providedSessionId,
		userId,
		role,
		res
	} = data;

  try {
    // [INIT SESSION]
    let sessionId = providedSessionId;
    if (!sessionId) {
      const newSession = await ChatSession.create({ userId });
      sessionId = newSession._id.toString();
    }
    const chatSession = await initializeChatSession(sessionId, userId, prompt, );
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
    logger.error('Error in streamWithCompletion:', error);
    throw error;
  }
};

module.exports = {
  streamWithCompletion,
};
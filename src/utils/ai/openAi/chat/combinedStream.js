const {
  initializeOpenAI,
  initializePinecone,
  initializeEmbeddings,
  initializeChatHistory,
  handleSummarization,
} = require('./initialize');
const { initializeChatSession, getSessionMessages, createMessage } = require('@/models/utils');
const { PineconeStore } = require('@langchain/pinecone');
const { StreamResponseHandler } = require('./handlers.js');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { createPineconeIndex } = require('@/utils/ai/pinecone/create.js');
const { logger } = require('@/config/logging');
const { getMainSystemMessageContent, getMainAssistantMessageInstructions } = require('@/lib/prompts/createPrompt');
const { performPerplexityCompletion } = require('./context');
const { checkApiKey } = require('@/utils/auth');

const combinedChatStream = async (req, res) => {
  logger.info(`REQUEST BODY: ${JSON.stringify(req.body)}`);
  const { clientApiKey, userId, workspaceId, sessionId, prompt, role, regenerate, count } = req.body;

  const initializationData = {
    apiKey: clientApiKey || process.env.OPENAI_API_PROJECT_KEY,
    providedUserId: userId,
    providedWorkspaceId: workspaceId,
    providedSessionId: sessionId,
    providedPrompt: regenerate ? null : prompt,
    providedRole: role,
    sessionLength: count || 0,
    temperature: 0.5,
    maxTokens: 1024,
    topP: 1,
    frequencyPenalty: 0.5,
    presencePenalty: 0,
    perplexityApiKey: process.env.PERPLEXITY_API_KEY,
    searchEngineKey: process.env.GOOGLE_SERPER_API_KEY,
    pineconeEnv: process.env.PINECONE_ENVIRONMENT,
    pineconeIndex: process.env.PINECONE_INDEX,
    namespace: process.env.PINECONE_NAMESPACE,
    dimensions: parseInt(process.env.EMBEDDING_MODEL_DIMENSIONS),
    embeddingModel: process.env.OPENAI_API_EMBEDDING_MODEL,
    completionModel: process.env.OPENAI_CHAT_COMPLETION_MODEL,
    res,
  };

  try {
    checkApiKey(clientApiKey, 'OpenAI');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const chatSession = await initializeChatSession(
      initializationData.providedSessionId,
      initializationData.providedWorkspaceId,
      initializationData.providedUserId,
      initializationData.providedPrompt,
      initializationData.sessionLength
    );

    const chatOpenAI = initializeOpenAI(initializationData.apiKey, chatSession, initializationData.completionModel);
    const pinecone = initializePinecone();
    const embedder = initializeEmbeddings(initializationData.apiKey);
    const chatHistory = initializeChatHistory(chatSession);

    const messages = (await getSessionMessages(chatSession._id)) || [];
    const summary = await handleSummarization(messages, chatOpenAI);
    logger.info(`[CHECK][summary]: ${JSON.stringify(summary)}`, summary);

    await chatHistory.addUserMessage(initializationData.providedPrompt);
    const newUserMessageId = await createMessage(
      chatSession._id,
      'user',
      initializationData.providedPrompt,
      initializationData.providedUserId,
      chatSession.messages.length + 1
    );
    chatSession.messages.push(newUserMessageId);
    chatSession.summary = summary;
    await chatSession.save();

    const searchResults = await performPerplexityCompletion(initializationData.providedPrompt, initializationData.perplexityApiKey);
    logger.info(`Search Results: ${JSON.stringify(searchResults)}`, searchResults);

    const vectorQueryStore = await PineconeStore.fromExistingIndex(embedder, {
      pineconeIndex: await createPineconeIndex(pinecone, initializationData.pineconeIndex),
      namespace: 'chat-history',
      textKey: 'text',
    });

    const vectorStore = await PineconeStore.fromExistingIndex(embedder, {
      pineconeIndex: await createPineconeIndex(pinecone, initializationData.pineconeIndex),
      namespace: 'library-documents',
      textKey: 'text',
    });

    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const splitDocs = await textSplitter.splitDocuments([searchResults]);
    await vectorStore.addDocuments(splitDocs);

    const relevantSessionHistory = await vectorQueryStore.similaritySearch(initializationData.providedPrompt, 5);
    const context = relevantSessionHistory.map(doc => doc.pageContent).join('\n');

    const relevantDocs = await vectorStore.similaritySearch(initializationData.providedPrompt, 5);
    const dbSearchResults = relevantDocs.map(doc => doc.pageContent).join('\n');

    const formattedPrompt = `Chat Context: ${context}\n\nSummary of previous messages: ${summary}\n\nUser: ${initializationData.providedPrompt}\n\nRelevant documents: ${dbSearchResults}\n\nAI:`;

    const responseHandler = new StreamResponseHandler();
    const systemContent = getMainSystemMessageContent();
    const assistantInstructions = getMainAssistantMessageInstructions();

    const result = await chatOpenAI.stream({
      model: initializationData.completionModel,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'assistant', content: assistantInstructions },
        { role: 'user', content: formattedPrompt },
      ],
      stream: true,
      stream_options: { include_usage: true },
      response_format: { type: 'json_object' },
    });

    for await (const chunk of result) {
      const chunkContent = await responseHandler.handleChunk(chunk);
      res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
      res.flush();

      if (responseHandler.isResponseComplete()) {
        const fullResponse = responseHandler.getFullResponse();

        const assistantMessageId = await createMessage(
          chatSession._id,
          'assistant',
          fullResponse,
          initializationData.providedUserId,
          chatSession.messages.length + 1
        );
        chatSession.messages.push(assistantMessageId);
        await chatSession.save();

        const docs = [
          { pageContent: initializationData.providedPrompt, metadata: { chatId: chatSession._id.toString(), role: 'user' } },
          { pageContent: fullResponse, metadata: { chatId: chatSession._id.toString(), role: 'assistant' } },
        ];
        const splitDocs = await textSplitter.splitDocuments(docs);
        await vectorQueryStore.addDocuments(splitDocs);
      }
    }

    res.write('data: [DONE]\n\n');
  } catch (error) {
    logger.error(`Error in combinedChatStream: ${error}`);
    if (!res.headersSent) {
      res.status(500).json({ error: 'An error occurred while processing the chat stream' });
    }
  } finally {
    res.end();
  }
};

module.exports = {
  combinedChatStream,
};
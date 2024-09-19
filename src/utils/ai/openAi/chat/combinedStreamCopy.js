const fs = require('fs');
const path = require('path');
const { PineconeStore } = require('@langchain/pinecone');
const { PromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence, RunnablePassthrough } = require('@langchain/core/runnables');
const { initializeOpenAI, initializePinecone, initializeEmbeddings, handleSummarization } = require('./initialize');
const { initializeChatSession, getSessionMessages, createMessage } = require('@/models/utils');
const { StreamResponseHandler } = require('./handlers.js');
const { createPineconeIndex } = require('@/utils/ai/pinecone/create.js');
const { logger } = require('@/config/logging');
const { getMainSystemMessageContent, getMainAssistantMessageInstructions } = require('@/lib/prompts/createPrompt');
const { performPerplexityCompletion } = require('./context');
const { checkApiKey } = require('@/utils/auth');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { StringOutputParser } = require('@langchain/core/output_parsers');

const combinedChatStream = async (req, res) => {
  logger.info(`REQUEST BODY: ${JSON.stringify(req.body)}`);
  const { clientApiKey, userId, workspaceId, sessionId, prompt, role, regenerate, count, streamType } = req.body;

  if (streamType === 'file') {
    return handleFileStreaming(req, res);
  }

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
    pineconeEnv: process.env.PINECONE_ENVIRONMENT,
    pineconeIndex: process.env.PINECONE_INDEX,
    namespace: process.env.PINECONE_NAMESPACE,
    dimensions: parseInt(process.env.EMBEDDING_MODEL_DIMENSIONS),
    embeddingModel: process.env.OPENAI_API_EMBEDDING_MODEL,
    completionModel: process.env.OPENAI_CHAT_COMPLETION_MODEL,
    gpt4Model: process.env.GPT4_MODEL || 'gpt-4',
  };

  try {
    checkApiKey(clientApiKey, 'OpenAI');
    setupResponseHeaders(res);

    const chatSession = await initializeChatSession(
      initializationData.providedSessionId,
      initializationData.providedWorkspaceId,
      initializationData.providedUserId,
      initializationData.providedPrompt,
      initializationData.sessionLength
    );

    const chatOpenAI = initializeOpenAI(initializationData.apiKey, chatSession, initializationData.completionModel);
    const embedder = initializeEmbeddings(initializationData.apiKey);
    const pinecone = initializePinecone();

    const [conversationVectorStore, componentVectorStore] = await initializeVectorStores(
      pinecone,
      embedder,
      initializationData
    );

    const messages = (await getSessionMessages(chatSession._id)) || [];
    const summary = await handleSummarization(messages, chatOpenAI);

    const searchResults = await performPerplexityCompletion(
      initializationData.providedPrompt,
      initializationData.perplexityApiKey
    );

    await updateComponentVectorStore(componentVectorStore, searchResults);

    const [conversationContext, componentContext] = await getRelevantContexts(
      conversationVectorStore,
      componentVectorStore,
      prompt
    );

    const chain = createChain(chatOpenAI, conversationContext, componentContext, summary);

    await streamResponse(chain, prompt, res, chatSession, initializationData, conversationVectorStore);

    res.write('data: [DONE]\n\n');
  } catch (error) {
    handleError(error, res);
  } finally {
    res.end();
  }
};

const handleFileStreaming = (req, res) => {
  const filePath = path.join(__dirname, '../../../uploads', req.body.fileName);
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'application/octet-stream',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'application/octet-stream',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
};

const setupResponseHeaders = res => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
};

const initializeVectorStores = async (pinecone, embedder, initializationData) => {
  const pineconeIndex = await createPineconeIndex(pinecone, initializationData.pineconeIndex);
  const conversationVectorStore = await PineconeStore.fromExistingIndex(embedder, {
    pineconeIndex,
    namespace: 'chat-history',
    textKey: 'text',
  });
  const componentVectorStore = await PineconeStore.fromExistingIndex(embedder, {
    pineconeIndex,
    namespace: 'component-library',
    textKey: 'text',
  });
  return [conversationVectorStore, componentVectorStore];
};

const updateComponentVectorStore = async (componentVectorStore, searchResults) => {
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
  const splitDocs = await textSplitter.splitDocuments([searchResults]);
  await componentVectorStore.addDocuments(splitDocs);
};

const getRelevantContexts = async (conversationVectorStore, componentVectorStore, prompt) => {
  const relevantConversation = await conversationVectorStore.similaritySearch(prompt, 5);
  const conversationContext = relevantConversation.map(doc => doc.pageContent).join('\n');
  const relevantComponents = await componentVectorStore.similaritySearch(prompt, 5);
  const componentContext = relevantComponents.map(doc => doc.pageContent).join('\n');
  return [conversationContext, componentContext];
};

const createChain = (chatOpenAI, conversationContext, componentContext, summary) => {
  const promptTemplate = PromptTemplate.fromTemplate(`
    System: {system_message}
    Assistant: {assistant_instructions}
    Human: Generate an advanced, creative, and professional React component or JavaScript code based on the following request: {human_input}
    Conversation Context: {conversation_context}
    Component Context: {component_context}
    Summary of previous messages: {summary}
    Please ensure your response includes:
    1. A brief explanation of the component's purpose and design rationale
    2. The full React component code, utilizing the latest React features and best practices
    3. Advanced styling using modern CSS-in-JS techniques or styled-components
    4. Performance optimizations and accessibility considerations
    5. Examples of how to use and customize the component
    6. Any necessary TypeScript types or PropTypes
    7. Suggestions for testing the component
    Format your response as a valid JSON object with markdown content.
  `);

  return RunnableSequence.from([
    {
      system_message: getMainSystemMessageContent(),
      assistant_instructions: getMainAssistantMessageInstructions(),
      human_input: new RunnablePassthrough(),
      conversation_context: async () => conversationContext,
      component_context: async () => componentContext,
      summary: async () => summary.overallSummary,
    },
    promptTemplate,
    chatOpenAI,
    new StringOutputParser(),
  ]);
};

const streamResponse = async (chain, prompt, res, chatSession, initializationData, conversationVectorStore) => {
  const responseHandler = new StreamResponseHandler();
  const stream = await chain.stream(prompt);

  for await (const chunk of stream) {
    const chunkContent = await responseHandler.handleChunk(chunk);
    res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
    res.flush();

    if (responseHandler.isResponseComplete()) {
      await handleCompleteResponse(responseHandler, chatSession, initializationData, conversationVectorStore, prompt);
    }
  }
};

const handleCompleteResponse = async (
  responseHandler,
  chatSession,
  initializationData,
  conversationVectorStore,
  prompt
) => {
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
    {
      pageContent: prompt,
      metadata: { chatId: chatSession._id.toString(), role: 'user' },
    },
    {
      pageContent: fullResponse,
      metadata: { chatId: chatSession._id.toString(), role: 'assistant' },
    },
  ];
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
  const splitDocs = await textSplitter.splitDocuments(docs);
  await conversationVectorStore.addDocuments(splitDocs);
};

const handleError = (error, res) => {
  logger.error(`Error in combinedChatStream: ${error}`);
  if (!res.headersSent) {
    res.status(500).json({ error: 'An error occurred while processing the chat stream' });
  }
};

module.exports = { combinedChatStream };
// const fs = require('fs');
// const path = require('path');
// const {
//   initializeOpenAI,
//   initializePinecone,
//   initializeEmbeddings,
//   initializeChatHistory,
//   handleSummarization,
// } = require('./initialize');
// const { initializeChatSession, getSessionMessages, createMessage } = require('@/models/utils');
// const { PineconeStore } = require('@langchain/pinecone');
// const { StreamResponseHandler } = require('./handlers.js');
// const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
// const { createPineconeIndex } = require('@/utils/ai/pinecone/create.js');
// const { logger } = require('@/config/logging');
// const { getMainSystemMessageContent, getMainAssistantMessageInstructions } = require('@/lib/prompts/createPrompt');
// const { performPerplexityCompletion } = require('./context');
// const { checkApiKey } = require('@/utils/auth');
// const { savePromptBuild } = require('../../shared/promptOptimization');
// const { OpenAI, ChatOpenAI } = require('@langchain/openai');
// const { PromptTemplate } = require('@langchain/core/prompts');
// const { RunnableSequence, RunnablePassthrough } = require('@langchain/core/runnables');
// const { StringOutputParser, JsonMarkdownStructuredOutputParser } = require('@langchain/core/output_parsers');

// const combinedChatStream = async (req, res) => {
//   logger.info(`REQUEST BODY: ${JSON.stringify(req.body)}`);
//   const { clientApiKey, userId, workspaceId, sessionId, prompt, role, regenerate, count, streamType } = req.body;

//   // Handle file streaming
//   if (streamType === 'file') {
//     const filePath = path.join(__dirname, '../../../uploads', req.body.fileName);
//     const stat = fs.statSync(filePath);
//     const fileSize = stat.size;
//     const range = req.headers.range;

//     if (range) {
//       const parts = range.replace(/bytes=/, '').split('-');
//       const start = parseInt(parts[0], 10);
//       const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
//       const chunksize = end - start + 1;
//       const file = fs.createReadStream(filePath, { start, end });
//       const head = {
//         'Content-Range': `bytes ${start}-${end}/${fileSize}`,
//         'Accept-Ranges': 'bytes',
//         'Content-Length': chunksize,
//         'Content-Type': 'application/octet-stream',
//       };
//       res.writeHead(206, head);
//       file.pipe(res);
//     } else {
//       const head = {
//         'Content-Length': fileSize,
//         'Content-Type': 'application/octet-stream',
//       };
//       res.writeHead(200, head);
//       fs.createReadStream(filePath).pipe(res);
//     }
//     return;
//   }

//   const initializationData = {
//     apiKey: clientApiKey || process.env.OPENAI_API_PROJECT_KEY,
//     providedUserId: userId,
//     providedWorkspaceId: workspaceId,
//     providedSessionId: sessionId,
//     providedPrompt: regenerate ? null : prompt,
//     providedRole: role,
//     sessionLength: count || 0,
//     temperature: 0.5,
//     maxTokens: 1024,
//     topP: 1,
//     frequencyPenalty: 0.5,
//     presencePenalty: 0,
//     perplexityApiKey: process.env.PERPLEXITY_API_KEY,
//     searchEngineKey: process.env.GOOGLE_SERPER_API_KEY,
//     pineconeEnv: process.env.PINECONE_ENVIRONMENT,
//     pineconeIndex: process.env.PINECONE_INDEX,
//     namespace: process.env.PINECONE_NAMESPACE,
//     dimensions: parseInt(process.env.EMBEDDING_MODEL_DIMENSIONS),
//     embeddingModel: process.env.OPENAI_API_EMBEDDING_MODEL,
//     completionModel: process.env.OPENAI_CHAT_COMPLETION_MODEL,
//     gpt4Model: process.env.GPT4_MODEL || 'gpt-4',
//     res,
//   };

//   try {
//     checkApiKey(clientApiKey, 'OpenAI');
//     res.setHeader('Content-Type', 'text/event-stream');
//     res.setHeader('Cache-Control', 'no-cache');
//     res.setHeader('Connection', 'keep-alive');

//     const chatSession = await initializeChatSession(
//       initializationData.providedSessionId,
//       initializationData.providedWorkspaceId,
//       initializationData.providedUserId,
//       initializationData.providedPrompt,
//       initializationData.sessionLength
//     );
//     // Initialize GPT-4 model
//     // const model = new ChatOpenAI({
//     //   apiKey: initializationData.apiKey,
//     //   modelName: 'gpt-4',
//     //   temperature: 0.7,
//     //   streaming: true,
//     //   callbacks: [
//     //     {
//     //       handleLLMNewToken(token) {
//     //         res.write(`data: ${JSON.stringify({ content: token })}\n\n`);
//     //         res.flush();
//     //       },
//     //     },
//     //   ],
//     // });
//     const chatOpenAI = initializeOpenAI(initializationData.apiKey, chatSession, initializationData.completionModel);
//     const embedder = initializeEmbeddings(initializationData.apiKey);
//     const pinecone = initializePinecone();
//     // Initialize two vector stores
//     const conversationVectorStore = await PineconeStore.fromExistingIndex(embedder, {
//       pineconeIndex: await createPineconeIndex(pinecone, initializationData.pineconeIndex),
//       namespace: 'chat-history',
//       textKey: 'text',
//     });

//     const componentVectorStore = await PineconeStore.fromExistingIndex(embedder, {
//       pineconeIndex: await createPineconeIndex(pinecone, initializationData.pineconeIndex),
//       namespace: 'component-library',
//       textKey: 'text',
//     });
//     const messages = (await getSessionMessages(chatSession._id)) || [];
//     const summary = await handleSummarization(messages, chatOpenAI);
//     const searchResults = await performPerplexityCompletion(
//       initializationData.providedPrompt,
//       initializationData.perplexityApiKey
//     );
//     const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
//     const splitDocs = await textSplitter.splitDocuments([searchResults]);
//     await componentVectorStore.addDocuments(splitDocs);

//     const relevantConversation = await conversationVectorStore.similaritySearch(prompt, 5);
//     const conversationContext = relevantConversation.map(doc => doc.pageContent).join('\\n');

//     const relevantComponents = await componentVectorStore.similaritySearch(prompt, 5);
//     const componentContext = relevantComponents.map(doc => doc.pageContent).join('\\n');
//     const promptTemplate = PromptTemplate.fromTemplate(`
//       System: {system_message}
//       Assistant: {assistant_instructions}
//       Human: Generate an advanced, creative, and professional React component or JavaScript code based on the following request: {human_input}

      // Please ensure your response includes:
      // 1. A brief explanation of the component's purpose and design rationale
      // 2. The full React component code, utilizing the latest React features and best practices
      // 3. Advanced styling using modern CSS-in-JS techniques or styled-components
      // 4. Performance optimizations and accessibility considerations
      // 5. Examples of how to use and customize the component
      // 6. Any necessary TypeScript types or PropTypes
      // 7. Suggestions for testing the component

      // Format your response as a valid JSON object with markdown content.
//     `);
//     // const retriever = vectorStore.asRetriever();
//     // const relevantDocs = await retriever.getRelevantDocuments(prompt);
//     // const relevantSessionHistory = await vectorQueryStore.similaritySearch(initializationData.providedPrompt, 5);
//     // const context = relevantSessionHistory.map(doc => doc.pageContent).join('\n');
//     // const dbSearchResults = relevantDocs.map(doc => doc.pageContent).join('\n');

//     // const chatHistory = initializeChatHistory(chatSession);
//     // await chatHistory.addUserMessage(initializationData.providedPrompt);
//     // const newUserMessageId = await createMessage(
//     //   chatSession._id,
//     //   'user',
//     //   initializationData.providedPrompt,
//     //   initializationData.providedUserId,
//     //   chatSession.messages.length + 1
//     // );
//     // chatSession.messages.push(newUserMessageId);
//     // chatSession.summary = summary;
//     // await chatSession.save();
//     let chain;
//     try {
//       chain = RunnableSequence.from([
//         promptTemplate,
//         chatOpenAI,
//         // new JsonMarkdownStructuredOutputParser(),
//         new StringOutputParser(),
//       ]);
//     } catch (error) {
//       logger.error(`Error occurred during chain execution: ${error.message}`);
//       res.writeHead(500);
//       res.end('Internal Server Error');
//       return;
//     }
//     const responseHandler = new StreamResponseHandler();

//     // const stream = await chain.stream(prompt);
//     const stream = await chain.invoke({
//       system_message: getMainSystemMessageContent(),
//       assistant_instructions: getMainAssistantMessageInstructions(),
//       human_input: new RunnablePassthrough(),
//       conversation_context: async () => conversationContext,
//       component_context: async () => componentContext,
//       summary: async () => summary.overallSummary,
//     });
//     for await (const chunk of stream) {
//       const chunkContent = await responseHandler.handleChunk(chunk);
//       res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
//       res.flush();

//       if (responseHandler.isResponseComplete()) {
//         const fullResponse = responseHandler.getFullResponse();

//         const assistantMessageId = await createMessage(
//           chatSession._id,
//           'assistant',
//           fullResponse,
//           initializationData.providedUserId,
//           chatSession.messages.length + 1
//         );
//         chatSession.messages.push(assistantMessageId);
//         await chatSession.save();

//         const docs = [
//           {
//             pageContent: initializationData.providedPrompt,
//             metadata: { chatId: chatSession._id.toString(), role: 'user' },
//           },
//           { pageContent: fullResponse, metadata: { chatId: chatSession._id.toString(), role: 'assistant' } },
//         ];
//         const splitDocs = await textSplitter.splitDocuments(docs);
//         await conversationVectorStore.addDocuments(splitDocs);
//       }
//     }
//     // for await (const chunk of stream) {
//     //   res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
//     //   res.flush();
//     // }

//     // const fullResponse = await chain.invoke(prompt);
//     // const newUserMessageId = await createMessage(
//     //   chatSession._id,
//     //   'user',
//     //   initializationData.providedPrompt,
//     //   initializationData.providedUserId,
//     //   chatSession.messages.length + 1
//     // );
//     // chatSession.messages.push(newUserMessageId);
//     // chatSession.summary = summary;
//     // await chatSession.save();

//     // // Update vector store with new conversation
//     // const newDocs = [
//     //   { pageContent: prompt, metadata: { chatId: chatSession._id.toString(), role: 'user' } },
//     //   { pageContent: fullResponse, metadata: { chatId: chatSession._id.toString(), role: 'assistant' } },
//     // ];
//     // const splitNewDocs = await textSplitter.splitDocuments(newDocs);
//     // await vectorStore.addDocuments(splitNewDocs);

    // const formattedPrompt = `
    // Chat Context: ${context}

    // Summary of previous messages: ${summary}

    // User Query: ${initializationData.providedPrompt}

    // Relevant documents: ${dbSearchResults}

    // Based on the user's query and the provided context, please generate a response following the instructions given in the system and assistant messages. Ensure that your answer is comprehensive, professional, and tailored to creating high-quality React styled components. Format your entire response as a valid JSON object.
    // `;

    // const responseHandler = new StreamResponseHandler();
    // const systemContent = getMainSystemMessageContent();
    // const assistantInstructions = getMainAssistantMessageInstructions();

    // await savePromptBuild(systemContent, assistantInstructions, formattedPrompt);

    // const result = await chatOpenAI.completionWithRetry({
    //   model: initializationData.completionModel,
    //   messages: [
    //     { role: 'system', content: systemContent },
    //     { role: 'assistant', content: assistantInstructions },
    //     { role: 'user', content: formattedPrompt },
    //   ],
    //   stream: true,
    //   stream_options: { include_usage: true },
    //   response_format: { type: 'json_object' },
    // });

//     // for await (const chunk of result) {
//     //   const chunkContent = await responseHandler.handleChunk(chunk);
//     //   res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
//     //   res.flush();

//     //   if (responseHandler.isResponseComplete()) {
//     //     const fullResponse = responseHandler.getFullResponse();

//     //     const assistantMessageId = await createMessage(
//     //       chatSession._id,
//     //       'assistant',
//     //       fullResponse,
//     //       initializationData.providedUserId,
//     //       chatSession.messages.length + 1
//     //     );
//     //     chatSession.messages.push(assistantMessageId);
//     //     await chatSession.save();

//     //     const docs = [
//     //       {
//     //         pageContent: initializationData.providedPrompt,
//     //         metadata: { chatId: chatSession._id.toString(), role: 'user' },
//     //       },
//     //       { pageContent: fullResponse, metadata: { chatId: chatSession._id.toString(), role: 'assistant' } },
//     //     ];
//     //     const splitDocs = await textSplitter.splitDocuments(docs);
//     //     await vectorQueryStore.addDocuments(splitDocs);
//     //   }
//     // }

//     res.write('data: [DONE]\n\n');
//   } catch (error) {
//     logger.error(`Error in combinedChatStream: ${error}`);
//     if (!res.headersSent) {
//       res.status(500).json({ error: 'An error occurred while processing the chat stream' });
//     }
//   } finally {
//     res.end();
//   }
// };

// module.exports = { combinedChatStream };

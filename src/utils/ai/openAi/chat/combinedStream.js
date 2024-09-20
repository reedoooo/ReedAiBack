const fs = require('fs');
const path = require('path');
const {
  initializeOpenAI,
  initializePinecone,
  initializeEmbeddings,
  initializeChatHistory,
  handleSummarization,
  initializeChatSession,
} = require('./initialize');
const { PineconeStore } = require('@langchain/pinecone');
const { StreamResponseHandler } = require('./handlers.js');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { createPineconeIndex } = require('@/utils/ai/pinecone/create.js');
const { logger } = require('@/config/logging');
const {
  getMainSystemMessageContent,
  getMainAssistantMessageInstructions,
} = require('@/lib/prompts/createPrompt');
const { performPerplexityCompletion } = require('./context');
const { checkApiKey } = require('@/utils/auth');
const {
  savePromptBuild,
  extractKeywords,
  identifyLibrariesAndComponents,
  getDocumentationUrl,
  scrapeDocumentation,
} = require('../../shared');
const { ChatSession } = require('@/models');
const {
  addMessageToChatHistory,
  updateMessageEmbedding,
  retrieveChatHistory,
} = require('./update');
const { lintAndFormatPrompt } = require('@/utils/processing/utils/format');
const { getBucket, updateRelatedDocuments, getGFS, generalStorageFunction } = require('@/db');
// Memoize getBucket and getGFS
const memoizedGetBucket = (() => {
  let bucket;
  return () => {
    if (!bucket) {
      bucket = getBucket();
    }
    return bucket;
  };
})();

const memoizedGetGFS = (() => {
  let gfs;
  return () => {
    if (!gfs) {
      gfs = getGFS();
    }
    return gfs;
  };
})();
const combinedChatStream = async (req, res) => {
  logger.info(`REQUEST BODY: ${JSON.stringify(req.body)}`);
  const {
    clientApiKey,
    userId,
    workspaceId,
    sessionId,
    prompt,
    role,
    regenerate,
    count,
    streamType,
  } = req.body;

  if (streamType === 'file') {
    return handleFileStreaming(req, res);
  }

  const initializationData = getInitializationData(req.body);

  try {
    setupResponseHeaders(res);
    checkApiKey(clientApiKey, 'OpenAI');

    const chatSession = await initializeChatSession(
      initializationData.sessionId,
      initializationData.workspaceId,
      initializationData.userId,
      prompt,
      initializationData.sessionLength
    );
    const chatOpenAI = initializeOpenAI(
      initializationData.apiKey,
      chatSession,
      initializationData.completionModel
    );
    const pinecone = initializePinecone();
    const embedder = initializeEmbeddings(initializationData.apiKey);
    const chatHistory = initializeChatHistory(chatSession);
    const messages = await chatHistory.getMessages();
    // logger.info(`[CHECK][messages]: ${JSON.stringify(messages)}`);
    // const messages = await retrieveChatHistory(chatSession);
    const summary = await handleSummarization(messages, chatOpenAI);
    // logger.info(`[CHECK][summary]: ${JSON.stringify(summary)}`);

    const userMessageDoc = await addMessageToChatHistory(chatSession, {
      role: 'user',
      content: initializationData.prompt,
      userId: initializationData.userId,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        sessionId: chatSession._id,
      },
    });
    logger.info(`[CHECK][userMessageDoc]: ${JSON.stringify(userMessageDoc)}`);
    logger.info(`[CHECK][chatSession]: ${JSON.stringify(chatHistory)}`);
    chatSession.summary = summary;
    await chatSession.save();

    const searchResults = await performPerplexityCompletion(
      initializationData.prompt,
      initializationData.perplexityApiKey
    );

    // logger.info(`Search Results: ${JSON.stringify(searchResults)}`);

    const { vectorQueryStore, vectorStore } = await setupVectorStores(
      pinecone,
      embedder,
      initializationData
    );
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    await vectorStore.addDocuments(await textSplitter.splitDocuments([searchResults]));

    const context = await getRelevantContext(
      vectorQueryStore,
      vectorStore,
      initializationData.prompt
    );
    const { keywords, uiLibraries, jsLibraries, componentTypes, documentationContent } =
      await extractAdditionalInfo(initializationData.prompt);

    const formattedPrompt = createFormattedPrompt(
      initializationData,
      context,
      summary,
      searchResults,
      keywords,
      uiLibraries,
      jsLibraries,
      componentTypes,
      documentationContent
    );

    // const responseHandler = new StreamResponseHandler();
    const systemContent = getMainSystemMessageContent();
    const assistantInstructions = getMainAssistantMessageInstructions();

    await savePromptBuild(systemContent, assistantInstructions, formattedPrompt);
    let result;
    try {
      logger.info(`[CHECK][formattedPrompt]: ${formattedPrompt} ${typeof formattedPrompt}`);
      logger.info(`[CHECK][systemContent]: ${systemContent} ${typeof systemContent}`);
      logger.info(
        `[CHECK][assistantInstructions]: ${assistantInstructions} ${typeof assistantInstructions}`
      );
      logger.info(
        `[CHECK][initializationData]: ${JSON.stringify(initializationData)} ${typeof initializationData}`
      );
      result = await chatOpenAI.completionWithRetry({
        model: 'gpt-4-1106-preview',
        // model: 'chatgpt-4o-latest',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'assistant', content: assistantInstructions },
          { role: 'user', content: formattedPrompt },
        ],
        stream: true,
        stream_options: { include_usage: true },
        response_format: { type: 'json_object' },
      });
      logger.info(`[CHECK][result]: ${JSON.stringify(result)}`);
      // createCompletionParams(
      //   initializationData,
      //   systemContent,
      //   assistantInstructions,
      //   formattedPrompt
      // )
      // );
    } catch (error) {
      logger.error(`[ERROR][completionWithRetry]: ${error.message}`);
      throw error;
    }
    await handleStreamingResponse(
      res,
      result,
      chatSession,
      userMessageDoc,
      textSplitter,
      vectorQueryStore,
      initializationData,
      chatHistory
    );
  } catch (error) {
    handleError(res, error);
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
    const { start, end, chunksize } = calculateRange(range, fileSize);
    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, createPartialContentHeaders(start, end, fileSize, chunksize));
    file.pipe(res);
  } else {
    res.writeHead(200, createFullContentHeaders(fileSize));
    fs.createReadStream(filePath).pipe(res);
  }
};

const getInitializationData = (body) => ({
  apiKey: body.clientApiKey || process.env.OPENAI_API_PROJECT_KEY,
  userId: body.userId,
  workspaceId: body.workspaceId,
  sessionId: body.sessionId,
  prompt: body.regenerate ? null : body.prompt,
  role: body.role,
  sessionLength: body.count || 0,
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
});

const setupResponseHeaders = (res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
};

const setupVectorStores = async (pinecone, embedder, initializationData) => {
  const pineconeIndex = await createPineconeIndex(pinecone, initializationData.pineconeIndex);
  const vectorQueryStore = await PineconeStore.fromExistingIndex(embedder, {
    pineconeIndex,
    namespace: 'chat-history',
    textKey: 'text',
  });
  const vectorStore = await PineconeStore.fromExistingIndex(embedder, {
    pineconeIndex,
    namespace: 'library-documents',
    textKey: 'text',
  });
  return { vectorQueryStore, vectorStore };
};

const getRelevantContext = async (vectorQueryStore, vectorStore, prompt) => {
  const relevantSessionHistory = await vectorQueryStore.similaritySearch(prompt, 5);
  const relevantDocs = await vectorStore.similaritySearch(prompt, 5);
  return {
    sessionContext: relevantSessionHistory.map((doc) => doc.pageContent).join('\n'),
    docsContext: relevantDocs.map((doc) => doc.pageContent).join('\n'),
  };
};

const extractAdditionalInfo = async (prompt) => {
  const keywords = await extractKeywords(prompt);
  const { uiLibraries, jsLibraries, componentTypes } = await identifyLibrariesAndComponents(prompt);
  const documentationContent = await getDocumentationContent(uiLibraries, componentTypes);
  return { keywords, uiLibraries, jsLibraries, componentTypes, documentationContent };
};

const getDocumentationContent = async (uiLibraries, componentTypes) => {
  let documentationContent = [];
  if (uiLibraries.length > 0 && componentTypes.length > 0) {
    for (const library of uiLibraries) {
      for (const componentType of componentTypes) {
        const docUrl = await getDocumentationUrl(library, componentType);
        if (docUrl) {
          const content = await scrapeDocumentation(docUrl);
          documentationContent.push({ library, componentType, content });
        }
      }
    }
  } else if (componentTypes.length > 0) {
    const randomLibraries = uiLibraries.sort(() => 0.5 - Math.random()).slice(0, 3);
    for (const library of randomLibraries) {
      for (const componentType of componentTypes) {
        const docUrl = await getDocumentationUrl(library.name, componentType);
        if (docUrl) {
          const content = await scrapeDocumentation(docUrl);
          documentationContent.push({ library: library.name, componentType, content });
        }
      }
    }
  }
  return documentationContent;
};

const createFormattedPrompt = (
  initializationData,
  context,
  summary,
  searchResults,
  keywords,
  uiLibraries,
  jsLibraries,
  componentTypes,
  documentationContent
) => `
  --- MAIN INSTRUCTIONS AND CONTEXT ---

  CHAT CONTEXT: ${context.sessionContext}
  SUMMARY OF CHAT HISTORY: ${summary}
  RELEVANT DOCS: ${context.docsContext}
  EXTRACTED KEYWORDS: ${keywords.join(', ')}
  IDENTIFIED UI LIBRARIES: ${uiLibraries.join(', ')}
  IDENTIFIED JS LIBRARIES: ${jsLibraries.join(', ')}
  IDENTIFIED COMPONENT TYPES: ${componentTypes.join(', ')}
  DOCUMENTATION CONTENT FROM SCRAPED UI LIBRARY CONTENT: ${documentationContent?.map((doc) => `${doc.library} - ${doc.componentType}:\n${doc.content}`).join('\n\n')}

  --- USER PROMPT/QUERY ---

  USER PROMPT/QUERY: ${initializationData.prompt}

  --- PERPLEXITY WEB SEARCH RESULTS ---

  RESULTS:
  ${searchResults.pageContent}

  CITATIONS:
  ${searchResults.metadata.citations}

  --- FINAL INSTRUCTIONS ---

  Based on the user's query, extracted information, and the provided context, please generate a response following the instructions given in the system and assistant messages. Ensure that your answer is comprehensive, professional, and tailored to creating high-quality React styled components. Please ensure your response includes:
  1. A brief explanation of the component's purpose and design rationale
  2. The full React component code, utilizing the latest React features and best practices
  3. Examples of how to use and customize the component

  --- RESPONSE FORMATTING INSTRUCTIONS ---

  Format your response as a valid JSON object with markdown content.

  `;
// 3. Advanced styling using modern CSS-in-JS techniques or styled-components
// 4. Performance optimizations and accessibility considerations
// 5. Examples of how to use and customize the component
// 6. Any necessary TypeScript types or PropTypes
// 7. Suggestions for testing the component
// const createCompletionParams = (
//   initializationData,
//   systemContent,
//   assistantInstructions,
//   formattedPrompt
// ) => ({
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

const handleStreamingResponse = async (
  res,
  result,
  // responseHandler,
  chatSession,
  userMessageDoc,
  textSplitter,
  vectorQueryStore,
  initializationData,
  chatHistory
) => {
  const responseHandler = new StreamResponseHandler();


  for await (const chunk of result) {
    const chunkContent = await responseHandler.handleChunk(chunk);
    res.write(`data: ${JSON.stringify(chunkContent)}\n\n`);
    res.flush();
    // const chunkContent = await responseHandler.handleChunk(chunk);
    // assistantResponse += chunkContent;
    // res.write(`data: ${JSON.stringify({chunkContent})}\n\n`);
    // res.flush();
  }

  if (responseHandler.isResponseComplete()) {
    let assistantResponse = responseHandler.getFullResponse();
    const assistantMessageDoc = await addMessageToChatHistory(chatSession, {
      role: 'assistant',
      content: assistantResponse,
    });
    await chatHistory.addMessage(assistantMessageDoc);

    // await ChatSession.findByIdAndUpdate(chatSession._id, {
    //   $push: {
    //     messages: [userMessageDoc._id, assistantMessageDoc._id],
    //   },
    // });

    // await updateMessageEmbedding(
    //   chatSession,
    //   userMessageDoc._id,
    //   'localEmbedding',
    //   generateLocalEmbedding(initializationData.prompt)
    // );
    // await updateMessageEmbedding(
    //   chatSession,
    //   assistantMessageDoc._id,
    //   'localEmbedding',
    //   generateLocalEmbedding(assistantResponse)
    // );

    const docs = [
      {
        pageContent: initializationData.prompt,
        metadata: { chatId: chatSession._id.toString(), role: 'user' },
      },
      {
        pageContent: assistantResponse,
        metadata: { chatId: chatSession._id.toString(), role: 'assistant' },
      },
    ];
    const splitDocs = await textSplitter.splitDocuments(docs);
    await vectorQueryStore.addDocuments(splitDocs);
    await chatSession.save();

    res.write('data: [DONE]\n\n');
  }
};

const handleError = (res, error) => {
  logger.error(`Error in combinedChatStream: ${error}`);
  if (!res.headersSent) {
    res.status(500).json({ error: 'An error occurred while processing the chat stream' });
  }
};

// async function generateLocalEmbedding(content) {
//   const generateEmbedding = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

//   const output = await generateEmbedding(content, {
//     pooling: 'mean',
//     normalize: true,
//   });

//   const embedding = Array.from(output.data);
//   return embedding;
// }

module.exports = { combinedChatStream };
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
//     userId: userId,
//     workspaceId: workspaceId,
//     sessionId: sessionId,
//     prompt: regenerate ? null : prompt,
//     role: role,
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
//     res,
//   };

//   try {
//     checkApiKey(clientApiKey, 'OpenAI');
//     res.setHeader('Content-Type', 'text/event-stream');
//     res.setHeader('Cache-Control', 'no-cache');
//     res.setHeader('Connection', 'keep-alive');

//     const chatSession = await initializeChatSession(
//       initializationData.sessionId,
//       initializationData.workspaceId,
//       initializationData.userId,
//       initializationData.prompt,
//       initializationData.sessionLength
//     );

//     const chatOpenAI = initializeOpenAI(initializationData.apiKey, chatSession, initializationData.completionModel);
//     const pinecone = initializePinecone();
//     const embedder = initializeEmbeddings(initializationData.apiKey);
//     const chatHistory = initializeChatHistory(chatSession);

//     const messages = await retrieveChatHistory(chatSession);
//     // const messages = (await getSessionMessages(chatSession._id)) || [];
//     const summary = await handleSummarization(messages, chatOpenAI);
//     logger.info(`[CHECK][summary]: ${JSON.stringify(summary)}`, summary);
//     const userMessageDoc = await addMessageToChatHistory(chatSession, {
//       role: 'user',
//       content: initializationData.prompt,
//       userId: initializationData.userId,
//     });
//     // await chatHistory.addUserMessage(initializationData.prompt);
//     // const newUserMessageId = await createMessage(
//     //   chatSession._id,
//     //   'user',
//     //   initializationData.prompt,
//     //   initializationData.userId,
//     //   chatSession.messages.length + 1
//     // );
//     // chatSession.messages.push(newUserMessageId);
//     chatSession.summary = summary;
//     await chatSession.save();

//     const searchResults = await performPerplexityCompletion(
//       initializationData.prompt,
//       initializationData.perplexityApiKey
//     );
//     logger.info(`Search Results: ${JSON.stringify(searchResults)}`, searchResults);

//     const vectorQueryStore = await PineconeStore.fromExistingIndex(embedder, {
//       pineconeIndex: await createPineconeIndex(pinecone, initializationData.pineconeIndex),
//       namespace: 'chat-history',
//       textKey: 'text',
//     });

//     const vectorStore = await PineconeStore.fromExistingIndex(embedder, {
//       pineconeIndex: await createPineconeIndex(pinecone, initializationData.pineconeIndex),
//       namespace: 'library-documents',
//       textKey: 'text',
//     });

//     const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
//     const splitDocs = await textSplitter.splitDocuments([searchResults]);
//     await vectorStore.addDocuments(splitDocs);

//     const relevantSessionHistory = await vectorQueryStore.similaritySearch(initializationData.prompt, 5);
//     const context = relevantSessionHistory.map(doc => doc.pageContent).join('\n');

//     const relevantDocs = await vectorStore.similaritySearch(initializationData.prompt, 5);
//     const dbSearchResults = relevantDocs.map(doc => doc.pageContent).join('\n');
//     // New additions from the template
//     const keywords = await extractKeywords(initializationData.prompt);
//     const { uiLibraries, jsLibraries, componentTypes } = await identifyLibrariesAndComponents(
//       initializationData.prompt
//     );
//     logger.info(`Identified UI Libraries: ${uiLibraries}`);
//     logger.info(`Identified JS Libraries: ${jsLibraries}`);
//     logger.info(`Identified Component Types: ${componentTypes}`);
//     let documentationContent = [];
//     if (uiLibraries.length > 0 && componentTypes.length > 0) {
//       for (const library of uiLibraries) {
//         for (const componentType of componentTypes) {
//           const docUrl = await getDocumentationUrl(library, componentType);
//           if (docUrl) {
//             const content = await scrapeDocumentation(docUrl);
//             documentationContent.push({ library, componentType, content });
//           }
//         }
//       }
//     } else if (componentTypes.length > 0) {
//       // If no specific library is mentioned, scrape three random libraries
//       const randomLibraries = uiLibraries.sort(() => 0.5 - Math.random()).slice(0, 3);

//       for (const library of randomLibraries) {
//         for (const componentType of componentTypes) {
//           const docUrl = await getDocumentationUrl(library.name, componentType);
//           if (docUrl) {
//             const content = await scrapeDocumentation(docUrl);
//             documentationContent.push({ library: library.name, componentType, content });
//           }
//         }
//       }
//     }
//     const formattedPrompt = `
//       Chat Context: ${context}
//       Summary of previous messages: ${summary}
//       User Query: ${initializationData.prompt}
//       Relevant documents: ${dbSearchResults}
//       Extracted Keywords: ${keywords.join(', ')}
//       Identified UI Libraries: ${uiLibraries.join(', ')}
//       Identified JS Libraries: ${jsLibraries.join(', ')}
//       Identified Component Types: ${componentTypes.join(', ')}

//       Documentation Content:
//       ${documentationContent.map(doc => `${doc.library} - ${doc.componentType}:\n${doc.content}`).join('\n\n')}

//       Based on the user's query, extracted information, and the provided context, please generate a response following the instructions given in the system and assistant messages.

//       Ensure that your answer is comprehensive, professional, and tailored to creating high-quality React styled components.

//       Please ensure your response includes:
//       1. A brief explanation of the component's purpose and design rationale
//       2. The full React component code, utilizing the latest React features and best practices
//       3. Advanced styling using modern CSS-in-JS techniques or styled-components
//       4. Performance optimizations and accessibility considerations
//       5. Examples of how to use and customize the component
//       6. Any necessary TypeScript types or PropTypes
//       7. Suggestions for testing the component

//       Format your response as a valid JSON object with markdown content.
//     `;
//     const responseHandler = new StreamResponseHandler();
//     const systemContent = getMainSystemMessageContent();
//     const assistantInstructions = getMainAssistantMessageInstructions();
//     await savePromptBuild(systemContent, assistantInstructions, formattedPrompt);

//     const result = await chatOpenAI.completionWithRetry({
//       model: initializationData.completionModel,
//       messages: [
//         { role: 'system', content: systemContent },
//         { role: 'assistant', content: assistantInstructions },
//         { role: 'user', content: formattedPrompt },
//       ],
//       stream: true,
//       stream_options: { include_usage: true },
//       response_format: { type: 'json_object' },
//     });

//     for await (const chunk of result) {
// const chunkContent = await responseHandler.handleChunk(chunk);
// res.write(`data: ${JSON.stringify(chunkContent)}\n\n`);
// res.flush();

//       if (responseHandler.isResponseComplete()) {
//         const assistantResponse = responseHandler.getFullResponse();
//         const assistantMessageDoc = await addMessageToChatHistory(chatSession, {
//           role: 'assistant',
//           content: assistantResponse,
//         });

//         // Update ChatSession with new message IDs
//         await ChatSession.findByIdAndUpdate(chatSession._id, {
//           $push: {
//             messages: [userMessageDoc._id, assistantMessageDoc._id],
//           },
//         });
//         // Generate and update embeddings for both messages
//         await updateMessageEmbedding(
//           chatSession,
//           userMessageDoc._id,
//           'localEmbedding',
//           generateLocalEmbedding(initializationData.prompt)
//         );
//         await updateMessageEmbedding(
//           chatSession,
//           assistantMessageDoc._id,
//           'localEmbedding',
//           generateLocalEmbedding(assistantResponse)
//         );
//         // Update vector store with new messages
//         const docs = [
//           {
//             pageContent: initializationData.prompt,
//             metadata: { chatId: chatSession._id.toString(), role: 'user' },
//           },
//           { pageContent: assistantResponse, metadata: { chatId: chatSession._id.toString(), role: 'assistant' } },
//         ];
//         const splitDocs = await textSplitter.splitDocuments(docs);
//         await vectorQueryStore.addDocuments(splitDocs);

//         res.write('data: [DONE]\n\n');
// const assistantMessageId = await createMessage(
//   chatSession._id,
//   'assistant',
//   fullResponse,
//   initializationData.userId,
//   chatSession.messages.length + 1
// );
// chatSession.messages.push(assistantMessageId);
// await chatSession.save();

// const docs = [
//   {
//     pageContent: initializationData.prompt,
//     metadata: { chatId: chatSession._id.toString(), role: 'user' },
//   },
//   { pageContent: assistantResponse, metadata: { chatId: chatSession._id.toString(), role: 'assistant' } },
// ];
// const splitDocs = await textSplitter.splitDocuments(docs);
// await vectorQueryStore.addDocuments(splitDocs);
//       }
//     }

//     // res.write('data: [DONE]\n\n');
//   } catch (error) {
//     logger.error(`Error in combinedChatStream: ${error}`);
//     if (!res.headersSent) {
//       res.status(500).json({ error: 'An error occurred while processing the chat stream' });
//     }
//   } finally {
//     res.end();
//   }
// };

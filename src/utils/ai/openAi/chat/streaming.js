// src/streamWithCompletion.js
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
const { PromptTemplate } = require('@langchain/core/prompts');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { createPineconeIndex } = require('@/utils/ai/pinecone/create.js');
const { logger } = require('@/config/logging');
const { getMainSystemMessageContent, getMainAssistantMessageInstructions } = require('@/lib/prompts/createPrompt');
const { performPerplexityCompletion } = require('./context');
function formatPrompt(context, summary, prompt, dbSearchResults) {
  return `Chat Context: ${context}\n\nSummary of previous messages: ${summary}\n\nUser: ${prompt}\n\nRelevant documents: ${dbSearchResults}\n\nAI:`;
}
const streamWithCompletion = async data => {
  const {
    apiKey,
    providedUserId: userId,
    providedWorkspaceId,
    providedSessionId,
    providedPrompt: prompt,
    providedRole: role,
    sessionLength,
    pineconeIndex,
    namespace,
    embeddingModel,
    dimensions,
    perplexityApiKey,
    searchEngineKey,
    completionModel,
    res,
  } = data;

  try {
    // Initialize session
    const chatSession = await initializeChatSession(
      providedSessionId,
      providedWorkspaceId,
      userId,
      prompt,
      sessionLength
    );
    const isNewSession = !providedSessionId;

    // Initialize OpenAI
    const chatOpenAI = initializeOpenAI(apiKey, chatSession, completionModel);

    // Initialize Pinecone
    const pinecone = initializePinecone();

    // Initialize embeddings
    const embedder = initializeEmbeddings(apiKey);

    // Initialize MongoDB chat history
    const chatHistory = initializeChatHistory(chatSession);

    // Get session messages
    const messages = (await getSessionMessages(chatSession._id)) || [];

    // Summarize messages
    const summary = await handleSummarization(messages, chatOpenAI);
    logger.info(`[CHECK][summary]: ${JSON.stringify(summary)}`, summary);

    await chatHistory.addUserMessage(prompt);
    const newUserMessageId = await createMessage(
      chatSession._id,
      'user',
      prompt,
      userId,
      chatSession.messages.length + 1
    );
    chatSession.messages.push(newUserMessageId);
    chatSession.summary = summary;
    await chatSession.save();

    // Use Perplexity AI completion as a search engine
    const searchResults = await performPerplexityCompletion(prompt, perplexityApiKey); // Fetch results using Perplexity AI
    logger.info(`Search Results: ${JSON.stringify(searchResults)}`, searchResults);
    // Pinecone query vector store setup
    const vectorQueryStore = await PineconeStore.fromExistingIndex(embedder, {
      pineconeIndex: await createPineconeIndex(pinecone, pineconeIndex),
      namespace: 'chat-history',
      textKey: 'text',
    });

    // Pinecone document vector store setup
    const vectorStore = await PineconeStore.fromExistingIndex(embedder, {
      pineconeIndex: await createPineconeIndex(pinecone, pineconeIndex),
      namespace: 'library-documents',
      textKey: 'text',
    });

    // Add search results to Pinecone store
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const splitDocs = await textSplitter.splitDocuments([searchResults]); // Ensure searchResults is an array
    await vectorStore.addDocuments(splitDocs);
    // Pinecone context query
    const relevantSessionHistory = await vectorQueryStore.similaritySearch(prompt, 5);
    logger.info(`Relevant History: ${JSON.stringify(relevantSessionHistory)}`, relevantSessionHistory);
    const context = relevantSessionHistory.map(doc => doc.pageContent).join('\n');

    // Pinecone document query
    const relevantDocs = await vectorStore.similaritySearch(prompt, 5);
    logger.info(`Relevant Docs: ${JSON.stringify(relevantDocs)}`, relevantDocs);
    const dbSearchResults = relevantDocs.map(doc => doc.pageContent).join('\n');
    // Prompt template setup
    const promptTemplate = new PromptTemplate({
      template: 'Chat Context: {context}\n\nSummary of previous messages: {summary}\n\nUser: {prompt}\nAI:',
      inputVariables: ['context', 'summary', 'prompt'],
    });
    const formattedPrompt = await promptTemplate.format({ context, summary, prompt, dbSearchResults });
    // Stream response handler
    const responseHandler = new StreamResponseHandler();
    let result;
    try {
      // Chat OpenAI completion
      const systemContent = getMainSystemMessageContent();
      const assistantInstructions = getMainAssistantMessageInstructions();
      result = await chatOpenAI.stream({
        model: completionModel,
        messages: [
          // ...messages,
          {
            role: 'system',
            content: systemContent,
          },
          { role: 'assistant', content: assistantInstructions },
          { role: 'user', content: formattedPrompt },
          // response.choices[0].message,
          // function_call_result_message,
        ],
        stream: true,
        stream_options: {
          include_usage: true,
        },
        response_format: { type: 'json_object' },
      });
    } catch (error) {
      logger.error('Error in chatOpenAI.stream:', error);
      throw error;
    }
    for await (const chunk of result) {
      // res.flushHeaders();
      const chunkContent = await responseHandler.handleChunk(chunk);
      // logger.info(`chunkContent: ${JSON.stringify(chunkContent)}`, chunkContent);
      res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
      res.flush();
      if (responseHandler.isResponseComplete()) {
        const fullResponse = responseHandler.getFullResponse();

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
          { pageContent: prompt, metadata: { chatId: chatSession._id.toString(), role: 'user' } },
          { pageContent: fullResponse, metadata: { chatId: chatSession._id.toString(), role: 'assistant' } },
        ];
        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });
        const splitDocs = await textSplitter.splitDocuments(docs);
        await vectorQueryStore.addDocuments(splitDocs);

        // If it's a new session, return the fully populated chatSession
        // if (isNewSession) {
        //   const populatedChatSession = await chatSession.populate('messages');
        //   res.write(`data: ${JSON.stringify({ content: fullResponse, newChatSession: populatedChatSession })}\n\n`);
        // } else {
        //   res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);
        // }
      }
    }
  } catch (error) {
    logger.error('Error in streamWithCompletion:', error);
    res.status(500).json({ error: 'An error occurred during processing' });
  } finally {
    res.end();
  }
};

module.exports = {
  streamWithCompletion,
};
// // const { ChatOpenAI } = require("langchain/chat_models/openai");
// // const { PromptTemplate } = require("langchain/prompts");
// // const { StringOutputParser } = require("langchain/schema/output_parser");
// // const { RunnableSequence, RunnablePassthrough } = require("langchain/schema/runnable");
// const { ChatOpenAI } = require('@langchain/openai');
// const { StructuredOutputParser } = require('langchain/output_parsers');
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
// const {
//   SystemMessagePromptTemplate,
//   HumanMessagePromptTemplate,
//   ChatPromptTemplate,
//   MessagesPlaceholder,
//   PromptTemplate,
// } = require('@langchain/core/prompts');
// const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
// const { createPineconeIndex } = require('@/utils/ai/pinecone/create.js');
// const { logger } = require('@/config/logging');
// const { getMainSystemMessageContent, getMainAssistantMessageInstructions } = require('@/lib/prompts/createPrompt');
// const { performPerplexityCompletion } = require('./context');
// const { ConversationChain } = require('langchain/chains');
// const { BufferMemory } = require('langchain/memory');
// const { StringOutputParser } = require('@langchain/core/output_parsers');
// const { RunnablePassthrough, RunnableSequence } = require('@langchain/core/runnables');
// const streamWithCompletion = async data => {
//   const {
//     apiKey,
//     providedUserId: userId,
//     providedWorkspaceId,
//     providedSessionId,
//     providedPrompt: prompt,
//     providedRole: role,
//     sessionLength,
//     pineconeIndex,
//     namespace,
//     embeddingModel,
//     dimensions,
//     perplexityApiKey,
//     searchEngineKey,
//     completionModel,
//     res,
//   } = data;

//   try {
//     // Initialize session
//     const chatSession = await initializeChatSession(
//       providedSessionId,
//       providedWorkspaceId,
//       userId,
//       prompt,
//       sessionLength
//     );
//     const isNewSession = !providedSessionId;

//     // Initialize OpenAI
//     const model = new ChatOpenAI({
//       openAIApiKey: apiKey || process.env.OPENAI_API_PROJECT_KEY,
//       modelName: completionModel,
//       temperature: chatSession.settings.temperature,
//       maxTokens: chatSession.settings.maxTokens,
//       streaming: true,
//     });

//     // Initialize Pinecone and embeddings
//     const pinecone = initializePinecone();
//     const embedder = initializeEmbeddings(apiKey);

//     // Initialize MongoDB chat history
//     const chatHistory = initializeChatHistory(chatSession);

//     // Get session messages
//     const messages = (await getSessionMessages(chatSession._id)) || [];

//     // Summarize messages
//     const summary = await handleSummarization(messages, model);
//     logger.info(`[CHECK][summary]: ${JSON.stringify(summary)}`, summary);

//     await chatHistory.addUserMessage(prompt);
//     const newUserMessageId = await createMessage(
//       chatSession._id,
//       'user',
//       prompt,
//       userId,
//       chatSession.messages.length + 1
//     );
//     chatSession.messages.push(newUserMessageId);
//     chatSession.summary = summary;
//     await chatSession.save();

//     // Use Perplexity AI completion as a search engine
//     const searchResults = await performPerplexityCompletion(prompt, perplexityApiKey);
//     logger.info(`Search Results: ${JSON.stringify(searchResults)}`, searchResults);

//     // Pinecone vector store setup
//     const vectorQueryStore = await PineconeStore.fromExistingIndex(embedder, {
//       pineconeIndex: await createPineconeIndex(pinecone, pineconeIndex),
//       namespace: 'chat-history',
//       textKey: 'text',
//     });

//     const vectorStore = await PineconeStore.fromExistingIndex(embedder, {
//       pineconeIndex: await createPineconeIndex(pinecone, pineconeIndex),
//       namespace: 'library-documents',
//       textKey: 'text',
//     });

//     // Add search results to Pinecone store
//     const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
//     const splitDocs = await textSplitter.splitDocuments([searchResults]);
//     await vectorStore.addDocuments(splitDocs);

//     // Pinecone queries
//     const relevantSessionHistory = await vectorQueryStore.similaritySearch(prompt, 5);
//     const context = relevantSessionHistory.map(doc => doc.pageContent).join('\n');

//     const relevantDocs = await vectorStore.similaritySearch(prompt, 5);
//     const dbSearchResults = relevantDocs.map(doc => doc.pageContent).join('\n');

//     // Create LangChain prompt templates
//     const systemPrompt = PromptTemplate.fromTemplate(getMainSystemMessageContent());
//     const assistantPrompt = PromptTemplate.fromTemplate(getMainAssistantMessageInstructions());
//     const humanPrompt = PromptTemplate.fromTemplate('{input}');

//     // Create the chain
//     const chain = RunnableSequence.from([
//       PromptTemplate.fromTemplate('System: {system}\n\nHuman: {input}\n\nAssistant: {assistant}'),
//       model,
//       new StringOutputParser(),
//     ]);

//     // Stream response handler
//     const responseHandler = new StreamResponseHandler();
//     try {
//       // Call the chain with streaming
//       const stream = await chain.stream({
//         input: prompt,
//         system: `Context: ${context}\n\nSummary: ${summary}\n\nRelevant documents: ${dbSearchResults}`,
//         assistant: getMainAssistantMessageInstructions(),
//       });
//       for await (const chunk of stream) {
//         const chunkContent = responseHandler.handleChunk({ choices: [{ delta: { content: chunk } }] });
//         res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
//       }
//     } catch (streamError) {
//       logger.error('Error in chain.stream:', streamError);
//       throw streamError;
//     }
//     const fullResponse = responseHandler.getFullResponse();

//     // Save assistant message
//     const assistantMessageId = await createMessage(
//       chatSession._id,
//       'assistant',
//       fullResponse,
//       userId,
//       chatSession.messages.length + 1
//     );
//     chatSession.messages.push(assistantMessageId);
//     await chatSession.save();

//     // Add the interaction to the vector store
//     const docs = [
//       { pageContent: prompt, metadata: { chatId: chatSession._id.toString(), role: 'user' } },
//       { pageContent: fullResponse, metadata: { chatId: chatSession._id.toString(), role: 'assistant' } },
//     ];
//     const splitInteractionDocs = await textSplitter.splitDocuments(docs);
//     await vectorQueryStore.addDocuments(splitInteractionDocs);

//     res.write(`data: [DONE]\n\n`);
//   } catch (error) {
//     logger.error('Error in streamWithCompletion:', error);
//     throw error;
//   }
// };

// module.exports = {
//   streamWithCompletion,
// };
// // src/streamWithCompletion.js
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
// const {
//   SystemMessagePromptTemplate,
//   HumanMessagePromptTemplate,
//   ChatPromptTemplate,
//   MessagesPlaceholder,
// } = require('@langchain/core/prompts');
// const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
// const { createPineconeIndex } = require('@/utils/ai/pinecone/create.js');
// const { logger } = require('@/config/logging');
// const { getMainSystemMessageContent } = require('@/lib/prompts/createPrompt');
// const { performPerplexityCompletion } = require('./context');
// const { ConversationChain } = require('langchain/chains');
// const { BufferMemory } = require("langchain/memory");

// const streamWithCompletion = async data => {
//   const {
//     apiKey,
//     providedUserId: userId,
//     providedWorkspaceId,
//     providedSessionId,
//     providedPrompt: prompt,
//     providedRole: role,
//     sessionLength,
//     pineconeIndex,
//     namespace,
//     embeddingModel,
//     dimensions,
//     perplexityApiKey,
//     searchEngineKey,
//     completionModel,
//     res,
//   } = data;

//   try {
//     // Initialize session
//     const chatSession = await initializeChatSession(
//       providedSessionId,
//       providedWorkspaceId,
//       userId,
//       prompt,
//       sessionLength
//     );
//     const isNewSession = !providedSessionId;

//     // Initialize OpenAI
//     const chatOpenAI = initializeOpenAI(apiKey, chatSession, completionModel);

//     // Initialize Pinecone
//     const pinecone = initializePinecone();

//     // Initialize embeddings
//     const embedder = initializeEmbeddings(apiKey);

//     // Initialize MongoDB chat history
//     const chatHistory = initializeChatHistory(chatSession);

//     // Get session messages
//     const messages = (await getSessionMessages(chatSession._id)) || [];

//     // Summarize messages
//     const summary = await handleSummarization(messages, chatOpenAI);
//     logger.info(`[CHECK][summary]: ${JSON.stringify(summary)}`, summary);

//     await chatHistory.addUserMessage(prompt);
//     const newUserMessageId = await createMessage(
//       chatSession._id,
//       'user',
//       prompt,
//       userId,
//       chatSession.messages.length + 1
//     );
//     chatSession.messages.push(newUserMessageId);
//     chatSession.summary = summary;
//     await chatSession.save();

//     // Use Perplexity AI completion as a search engine
//     const searchResults = await performPerplexityCompletion(prompt, perplexityApiKey); // Fetch results using Perplexity AI
//     logger.info(`Search Results: ${JSON.stringify(searchResults)}`, searchResults);
//     // Pinecone query vector store setup
//     const vectorQueryStore = await PineconeStore.fromExistingIndex(embedder, {
//       pineconeIndex: await createPineconeIndex(pinecone, pineconeIndex),
//       namespace: 'chat-history',
//       textKey: 'text',
//     });

//     // Pinecone document vector store setup
//     const vectorStore = await PineconeStore.fromExistingIndex(embedder, {
//       pineconeIndex: await createPineconeIndex(pinecone, pineconeIndex),
//       namespace: 'library-documents',
//       textKey: 'text',
//     });

//     // Add search results to Pinecone store
//     const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
//     const splitDocs = await textSplitter.splitDocuments([searchResults]); // Ensure searchResults is an array
//     await vectorStore.addDocuments(splitDocs);
//     // Pinecone context query
//     const relevantSessionHistory = await vectorQueryStore.similaritySearch(prompt, 5);
//     logger.info(`Relevant History: ${JSON.stringify(relevantSessionHistory)}`, relevantSessionHistory);
//     const context = relevantSessionHistory.map(doc => doc.pageContent).join('\n');

//     // Pinecone document query
//     const relevantDocs = await vectorStore.similaritySearch(prompt, 5);
//     logger.info(`Relevant Docs: ${JSON.stringify(relevantDocs)}`, relevantDocs);
//     const dbSearchResults = relevantDocs.map(doc => doc.pageContent).join('\n');
//     // Create LangChain prompt template
//     const chatPrompt = ChatPromptTemplate.fromMessages([
//       SystemMessagePromptTemplate.fromTemplate(getMainSystemMessageContent()),
//       new MessagesPlaceholder('history'),
//       HumanMessagePromptTemplate.fromTemplate('{input}'),
//     ]);
//     // Create ConversationChain
//     const chain = new ConversationChain({
//       memory: new BufferMemory({ returnMessages: true, memoryKey: 'history' }),
//       prompt: chatPrompt,
//       llm: chatOpenAI,
//     });
//     const responseHandler = new StreamResponseHandler();
//     // Generate response
//     const stream = await chain.call(
//       {
//         input: `Context: ${context}\n\nSummary: ${summary}\n\nUser: ${prompt}\n\nRelevant documents: ${dbSearchResults}`,
//       },
//       {
//         callbacks: [
//           {
//             handleLLMNewToken(token) {
//               const chunkContent = responseHandler.handleChunk({ choices: [{ delta: { content: token } }] });
//               res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
//             },
//           },
//         ],
//       }
//     );

//     const fullResponse = stream.response; // Prompt template setup
//     // Save assistant message
//     const assistantMessageId = await createMessage(
//       chatSession._id,
//       'assistant',
//       fullResponse,
//       userId,
//       chatSession.messages.length + 1
//     );
//     chatSession.messages.push(assistantMessageId);
//     await chatSession.save();

//     // Add the interaction to the vector store
//     const docs = [
//       { pageContent: prompt, metadata: { chatId: chatSession._id.toString(), role: 'user' } },
//       { pageContent: fullResponse, metadata: { chatId: chatSession._id.toString(), role: 'assistant' } },
//     ];
//     const splitInteractionDocs = await textSplitter.splitDocuments(docs);
//     await vectorQueryStore.addDocuments(splitInteractionDocs);

//     res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);
//     // const promptTemplate = new PromptTemplate({
//     //   template: 'Chat Context: {context}\n\nSummary of previous messages: {summary}\n\nUser: {prompt}\nAI:',
//     //   inputVariables: ['context', 'summary', 'prompt'],
//     // });
//     // const formattedPrompt = await promptTemplate.format({ context, summary, prompt, dbSearchResults });
//     // // Stream response handler
//     // let result;
//     // try {
//     //   // Chat OpenAI completion
//     //   const systemContent = getMainSystemMessageContent();
//     //   const assistantInstructions = getMainAssistantMessageInstructions();
//     //   result = await chatOpenAI.completionWithRetry({
//     //     model: completionModel,
//     //     messages: [
//     //       // ...messages,
//     //       {
//     //         role: 'system',
//     //         content: systemContent,
//     //       },
//     //       { role: 'assistant', content: assistantInstructions },
//     //       { role: 'user', content: formattedPrompt },
//     //       // response.choices[0].message,
//     //       // function_call_result_message,
//     //     ],
//     //     stream: true,
//     //     stream_options: {
//     //       include_usage: true,
//     //     },
//     //     response_format: { type: 'json_object' },
//     //   });
//     // } catch (error) {
//     //   logger.error('Error in chatOpenAI.completionWithRetry:', error);
//     //   throw error;
//     // }
//     // for await (const chunk of result) {
//     //   // res.flushHeaders();
//     //   const chunkContent = await responseHandler.handleChunk(chunk);
//     //   // logger.info(`chunkContent: ${JSON.stringify(chunkContent)}`, chunkContent);
//     //   res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);

//     //   if (responseHandler.isResponseComplete()) {
//     //     const fullResponse = responseHandler.getFullResponse();

//     //     const assistantMessageId = await createMessage(
//     //       chatSession._id,
//     //       'assistant',
//     //       fullResponse,
//     //       userId,
//     //       chatSession.messages.length + 1
//     //     );
//     //     chatSession.messages.push(assistantMessageId);
//     //     await chatSession.save();

//     //     // Add the interaction to the vector store
//     //     const docs = [
//     //       { pageContent: prompt, metadata: { chatId: chatSession._id.toString(), role: 'user' } },
//     //       { pageContent: fullResponse, metadata: { chatId: chatSession._id.toString(), role: 'assistant' } },
//     //     ];
//     //     const textSplitter = new RecursiveCharacterTextSplitter({
//     //       chunkSize: 1000,
//     //       chunkOverlap: 200,
//     //     });
//     //     const splitDocs = await textSplitter.splitDocuments(docs);
//     //     await vectorQueryStore.addDocuments(splitDocs);
//     //   }
//     // }
//   } catch (error) {
//     logger.error('Error in streamWithCompletion:', error);
//     throw error;
//   }
// };

// module.exports = {
//   streamWithCompletion,
// };

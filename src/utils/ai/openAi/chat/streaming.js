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
const { performWebSearch, performPerplexityCompletion } = require('./context');

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

    // Initialize the Perplexity chat model
    // const llm = new ChatPerplexity({
    //   model: 'llama-3-sonar-small-32k-online', // Choose your desired model
    //   temperature: 0.7, // Set the temperature for response variability
    //   pplxApiKey: 'YOUR_PERPLEXITY_API_KEY', // Add your Perplexity API key here
    // });
    // const prompt = PromptTemplate.fromTemplate(
    //   "You are an agent that will analyze and give statistical responses for the data CONTEXT: {context} USER QUESTION: {question}"
    // );

    // // Create the RAG chain
    // const ragChain = RetrievalQAChain.fromLLM({
    //   llm,
    //   prompt,
    //   outputParser: new StringOutputParser(),
    // });

    // // Invoke the chain to return a response
    // const result = await ragChain.invoke({
    //   question: query,
    //   context: vectorResult,
    // });
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
    const splitDocs = await textSplitter.splitDocuments(searchResults);
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

    // Create a message containing the result of the function call
    // const function_call_result_message = {
    //   role: 'tool',
    //   content: JSON.stringify({
    //     order_id: order_id,
    //     delivery_date: delivery_date.format('YYYY-MM-DD HH:mm:ss'),
    //   }),
    //   tool_call_id: response.choices[0].message.tool_calls[0].id,
    // };
    // // Prepare the chat completion call payload
    // const completion_payload = {
    //   model: null,
    // messages: [
    //   {
    //     role: 'system',
    //     content: getMainSystemMessageContent().content,
    //   },
    //   { role: 'assistant', content: getMainAssistantMessageInstructions().content },
    //   { role: 'user', content: formattedPrompt },
    //   response.choices[0].message,
    //   function_call_result_message,
    // ],
    //   stream: true,
    //   response_format: { type: 'json_object' },
    //   temperature: 0.9,
    // };
    let result;
    try {
      // Chat OpenAI completion
      const systemContent = getMainSystemMessageContent();
      const assistantInstructions = getMainAssistantMessageInstructions();
      result = await chatOpenAI.completionWithRetry({
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
        // stream_options: {
        //   include_usage: true,
        // },
        response_format: { type: 'json_object' },
      });
    } catch (error) {
      logger.error('Error in chatOpenAI.completionWithRetry:', error);
      throw error;
    }
    for await (const chunk of result) {
      // res.flushHeaders();
      const chunkContent = await responseHandler.handleChunk(chunk);
      // logger.info(`chunkContent: ${JSON.stringify(chunkContent)}`, chunkContent);
      res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);

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
// const { Pinecone } = require('@pinecone-database/pinecone');
// const { MongoDBChatMessageHistory } = require('@langchain/mongodb');
// const { TokenTextSplitter, RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
// const { PineconeStore } = require('@langchain/pinecone');
// const { OpenAIEmbeddings, ChatOpenAI, OpenAI } = require('@langchain/openai');
// const { PromptTemplate } = require('@langchain/core/prompts');
// const { User, Model, ChatFile, ChatSession, Message } = require('@/models');
// const { initializeChatSession, getSessionMessages, createMessage } = require('@/models/utils/index.js');
// const logger = require('@/config/logging/index.js');
// const { checkApiKey } = require('@/utils/auth/user.js');
// const { getEnv } = require('@/utils/api/env.js');
// const { createPineconeIndex } = require('@/utils/ai/pinecone/create.js');
// const { summarizeMessages, extractSummaries } = require('./context.js');
// const { StreamResponseHandler } = require('./handlers.js');
// const { getOpenaiLangChainClient } = require('../openAi/get.js');

// // --- MAIN FUNCTION ---
// const streamWithCompletion = async data => {
//   const {
//     apiKey,
//     pineconeIndex,
//     namespace,
//     embeddingModel,
//     dimensions,
//     completionModel,
//     temperature,
//     maxTokens,
//     topP,
//     frequencyPenalty,
//     presencePenalty,
//     prompt,
//     providedWorkspaceId,
//     providedSessionId,
//     userId,
//     role,
//     res,
//   } = data;

//   try {
//     // [INIT SESSION]
//     let sessionId = providedSessionId;
//     let workspaceId = providedWorkspaceId;
//     // if (!sessionId) {
//     //   const newSession = await ChatSession.create({ userId, workspaceId: providedWorkspaceId });
//     //   sessionId = newSession._id.toString();
//     // }
//     const chatSession = await initializeChatSession(sessionId, workspaceId, userId, prompt);
//     // [INIT OPENAI]
//     const configs = {
//       modelName: completionModel,
//       temperature: chatSession.settings.temperature,
//       maxTokens: chatSession.settings.maxTokens,
//       topP: chatSession.settings.topP,
//       n: chatSession.settings.n,
//       streaming: true,
//       openAIApiKey: apiKey || process.env.OPENAI_API_PROJECT_KEY,
//       organization: 'reed_tha_human',
//       functions: {
//         summarize_messages: {
//           parameters: {
//             type: 'object',
//             properties: {
//               summary: {
//                 type: 'string',
//                 description: 'A concise summary of the chat messages',
//               },
//             },
//             required: ['summary'],
//           },
//         },
//       },
//       function_call: 'auto',
//     }
//     const chatOpenAI = getOpenaiLangChainClient(configs);
//     // const chatOpenAI = new ChatOpenAI({
//     //   modelName: completionModel,
//     //   temperature: chatSession.settings.temperature,
//     //   maxTokens: chatSession.settings.maxTokens,
//     //   topP: chatSession.settings.topP,
//     //   n: chatSession.settings.n,
//     //   streaming: true,
//     //   openAIApiKey: apiKey || process.env.OPENAI_API_PROJECT_KEY,
//     //   organization: 'reed_tha_human',
//     //   functions: {
//     //     summarize_messages: {
//     //       parameters: {
//     //         type: 'object',
//     //         properties: {
//     //           summary: {
//     //             type: 'string',
//     //             description: 'A concise summary of the chat messages',
//     //           },
//     //         },
//     //         required: ['summary'],
//     //       },
//     //     },
//     //   },
//     //   function_call: 'auto',
//     // });
//     // [INIT PINECONE]
//     const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
//     // [INIT LANGCHAIN EMBEDDINGS]
//     const embedder = new OpenAIEmbeddings({
//       modelName: 'text-embedding-3-small',
//       apiKey: apiKey || process.env.OPENAI_API_PROJECT_KEY,
//       dimensions: 512, // Use 512-dimensional embeddings
//     });
//     // [MONGODB HISTORY INIT]
//     const chatHistory = new MongoDBChatMessageHistory({
//       collection: Message.collection, // Use your existing Message collection
//       sessionId: chatSession._id,
//     });
//     // [GET SESSION MESSAGES]
//     const messages = (await getSessionMessages(chatSession._id)) || [];
//     // [SUMMARIZE MESSAGES]
//     const summary = await summarizeMessages(messages.slice(-5), chatOpenAI);
//     const { overallSummaryString, individualSummariesArray } = extractSummaries(summary);

//     logger.info('Overall Summary:', overallSummaryString);
//     logger.info('Individual Summaries:', individualSummariesArray);
//     // const summary = await summarizeMessages(messages, chatOpenAI);
//     logger.info(`SUMMARY: ${summary}`);
//     await chatHistory.addUserMessage(prompt);
//     const newUserMessageId = await createMessage(
//       chatSession._id,
//       'user',
//       prompt,
//       userId,
//       // summary,
//       chatSession.messages.length + 1
//     );
//     logger.info(`New User Message: ${newUserMessageId}`);
//     logger.info(`Updated Chat Session Messages: ${JSON.stringify(chatSession.messages)}\n`);
//     chatSession.messages.push(newUserMessageId);
//     chatSession.summary = summary;
//     await chatSession.save();
//     // [PINECONE VECTOR STORE SETUP]
//     const vectorStore = await PineconeStore.fromExistingIndex(embedder, {
//       pineconeIndex: await createPineconeIndex(pinecone, pineconeIndex),
//       namespace: 'library-documents',
//       textKey: 'text',
//     });
//     // [PINECONE QUERY]
//     const relevantDocs = await vectorStore.similaritySearch(prompt, 5);
//     logger.info(`Relevant Docs: ${JSON.stringify(relevantDocs)}`, relevantDocs);
//     const context = relevantDocs.map(doc => doc.pageContent).join('\n');
//     logger.info(`Context: ${context}`);
//     // [PROMPT TEMPLATE SETUP]
//     const promptTemplate = new PromptTemplate({
//       template: 'Context: {context}\n\nSummary of previous messages: {summary}\n\nUser: {prompt}\nAI:',
//       inputVariables: ['context', 'summary', 'prompt'],
//     });
//     const formattedPrompt = await promptTemplate.format({ context, summary, prompt });
//     logger.info(`Formatted Prompt: ${formattedPrompt}`);
//     // [STREAM RESPONSE HANDLER]
//     const responseHandler = new StreamResponseHandler();
//     // [CHAT OPENAI COMPLETION]
//     const result = await chatOpenAI.completionWithRetry({
//       model: completionModel,
//       messages: [...messages, { role: 'user', content: formattedPrompt }],
//       stream: true,
//       response_format: { type: 'json_object' },
//     });
//     logger.info(`Chat RESULT: ${JSON.stringify(result)}`, result);

//     for await (const chunk of result) {
//       res.flushHeaders();
//       // logger.info(`chunk: ${JSON.stringify(chunk)}`, chunk);
//       const chunkContent = await responseHandler.handleChunk(chunk);
//       logger.info(`chunkContent: ${JSON.stringify(chunkContent)}`, chunkContent);
//       res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);

//       if (responseHandler.isResponseComplete()) {
//         const fullResponse = responseHandler.getFullResponse();
//         logger.debug(`fullResponse fullResponse: ${JSON.stringify(fullResponse)}`, fullResponse);

//         const assistantMessageId = await createMessage(
//           chatSession._id,
//           'assistant',
//           fullResponse,
//           userId,
//           chatSession.messages.length + 1
//         );
//         chatSession.messages.push(assistantMessageId);
//         await chatSession.save();

//         // Add the interaction to the vector store
//         const docs = [
//           { pageContent: prompt, metadata: { chatId: sessionId, role: 'user' } },
//           { pageContent: fullResponse, metadata: { chatId: sessionId, role: 'assistant' } },
//         ];
//         const textSplitter = new RecursiveCharacterTextSplitter({
//           chunkSize: 1000,
//           chunkOverlap: 200,
//         });
//         const splitDocs = await textSplitter.splitDocuments(docs);
//         await vectorStore.addDocuments(splitDocs);
//       }
//     }
//   } catch (error) {
//     logger.error('Error in streamWithCompletion:', error);
//     throw error;
//   }
// };

// module.exports = {
//   streamWithCompletion,
// };

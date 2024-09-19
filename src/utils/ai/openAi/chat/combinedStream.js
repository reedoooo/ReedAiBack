const fs = require('fs');
const path = require('path');
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
const {
  savePromptBuild,
  extractKeywords,
  identifyLibrariesAndComponents,
  getDocumentationUrl,
  scrapeDocumentation,
} = require('../../shared');

const combinedChatStream = async (req, res) => {
  logger.info(`REQUEST BODY: ${JSON.stringify(req.body)}`);
  const { clientApiKey, userId, workspaceId, sessionId, prompt, role, regenerate, count, streamType } = req.body;

  // Handle file streaming
  if (streamType === 'file') {
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
    return;
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

    const searchResults = await performPerplexityCompletion(
      initializationData.providedPrompt,
      initializationData.perplexityApiKey
    );
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
    // New additions from the template
    const keywords = await extractKeywords(initializationData.providedPrompt);
    const { uiLibraries, jsLibraries, componentTypes } = await identifyLibrariesAndComponents(
      initializationData.providedPrompt
    );
    logger.info(`Identified UI Libraries: ${uiLibraries}`);
    logger.info(`Identified JS Libraries: ${jsLibraries}`);
    logger.info(`Identified Component Types: ${componentTypes}`);
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
      // If no specific library is mentioned, scrape three random libraries
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
    const formattedPrompt = `
      Chat Context: ${context}
      Summary of previous messages: ${summary}
      User Query: ${initializationData.providedPrompt}
      Relevant documents: ${dbSearchResults}
      Extracted Keywords: ${keywords.join(', ')}
      Identified UI Libraries: ${uiLibraries.join(', ')}
      Identified JS Libraries: ${jsLibraries.join(', ')}
      Identified Component Types: ${componentTypes.join(', ')}

      Documentation Content:
      ${documentationContent.map(doc => `${doc.library} - ${doc.componentType}:\n${doc.content}`).join('\n\n')}

      Based on the user's query, extracted information, and the provided context, please generate a response following the instructions given in the system and assistant messages.

      Ensure that your answer is comprehensive, professional, and tailored to creating high-quality React styled components.

      Please ensure your response includes:
      1. A brief explanation of the component's purpose and design rationale
      2. The full React component code, utilizing the latest React features and best practices
      3. Advanced styling using modern CSS-in-JS techniques or styled-components
      4. Performance optimizations and accessibility considerations
      5. Examples of how to use and customize the component
      6. Any necessary TypeScript types or PropTypes
      7. Suggestions for testing the component

      Format your response as a valid JSON object with markdown content.
    `;
    const responseHandler = new StreamResponseHandler();
    const systemContent = getMainSystemMessageContent();
    const assistantInstructions = getMainAssistantMessageInstructions();
    await savePromptBuild(systemContent, assistantInstructions, formattedPrompt);

    const result = await chatOpenAI.completionWithRetry({
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
          {
            pageContent: initializationData.providedPrompt,
            metadata: { chatId: chatSession._id.toString(), role: 'user' },
          },
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

module.exports = { combinedChatStream };

const { User, Model, ChatFile, ChatSession, Message } = require('../../../models');
const { initializeChatSession, getSessionMessages, createMessage } = require('../../../models/utils');
// const { default: OpenAI } = require('openai');
const { PineconeStore } = require('@langchain/pinecone');
const { OpenAIEmbeddings, ChatOpenAI, OpenAI } = require('@langchain/openai');
const { PromptTemplate, ChatPromptTemplate, HumanMessagePromptTemplate } = require('@langchain/core/prompts');
const {
  getEnv,
  checkApiKey,
  createPineconeIndex,
  extractContent,
  processChunkBatch,
  parseContent,
} = require('../../../utils');
const logger = require('../../../config/logging/index.js');
const { Pinecone } = require('@pinecone-database/pinecone');
const { MongoDBChatMessageHistory } = require('@langchain/mongodb');

// --- INITIALIZE COMPONENTS ---
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

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
const buildPromptFromTemplate = async (previousMessages, prompt) => {
  try {
    const tempObj = {
      input: `Please respond to the following prompt: ${prompt} Previous conversation context: ${previousMessages}`,
    };
    const promptTemplate = new PromptTemplate({
      template: tempObj.input,
      inputVariables: ['previousMessages', 'prompt'],
    });
    return promptTemplate.format();
  } catch (error) {
    throw new Error(`Error building prompt from template: ${error.message}`);
  }
};
// --- MAIN FUNCTION ---
const withChatCompletion = async data => {
  const { apiKey, pineconeIndex, completionModel, namespace, prompt, sessionId, userId, role, stream, res } = data;

  try {
    // [INIT SESSION]
    const chatSession = await initializeChatSession(sessionId, userId);

    // [MONGODB HISTORY INIT]
    const chatHistory = new MongoDBChatMessageHistory({
      collection: Message.collection, // Use your existing Message collection
      sessionId: chatSession._id,
    });
    logger.debug(`CHAT HISTORY: ${JSON.stringify(chatHistory)}`);

    const messages = (await getSessionMessages(chatSession._id)) || [];
    const previousMessages = messages
      .slice(1)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    logger.info(`PREVIOUS MESSAGES: ${JSON.stringify(previousMessages)}`);

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

    // [PINECONE EMBEDDING SETUP]
    const embedder = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      apiKey: apiKey || process.env.OPENAI_API_KEY,
      dimensions: 512, // Use 512-dimensional embeddings
    });
    const vectorStore = await PineconeStore.fromExistingIndex(embedder, {
      pineconeIndex: await createPineconeIndex(pinecone, pineconeIndex),
      namespace: namespace,
    });

    // [PROMPT TEMPLATE SETUP]
    const formattedPrompt = await buildPromptFromTemplate(previousMessages, prompt);
    logger.info(`Formatted Prompt: ${formattedPrompt}`);

    // [STREAM RESPONSE HANDLER]
    const responseHandler = new StreamResponseHandler();

    const chatOpenAI = new ChatOpenAI({
      modelName: completionModel,
      temperature: chatSession.settings.temperature,
      maxTokens: chatSession.settings.maxTokens,
      topP: chatSession.settings.topP,
      n: chatSession.settings.n,
      streaming: true,
      openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
    });

    logger.info(`Chat OpenAI: ${JSON.stringify(chatOpenAI)}`, chatOpenAI);
    // const result = await chatOpenAI.generate({
    //   prompts: JSON.stringify(formattedPrompt),
    //   // JSON.stringify([...messages, { role: 'user', content: formattedPrompt }]),
    // });
    const result = await chatOpenAI.completionWithRetry({
      model: completionModel,
      messages: [...messages, { role: 'user', content: prompt }],
      stream: true,
      response_format: { type: 'json_object' },
    });
    logger.info(`Chat RESULT: ${JSON.stringify(result)}`, result);

    for await (const chunk of result) {
      const chunkContent = responseHandler.handleChunk(chunk);
      // process.stdout.write(chunkContent || '');

      res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
      if (responseHandler.isResponseComplete()) {
        const fullResponse = responseHandler.getFullResponse();
        logger.info(`fullResponse fullResponse: ${JSON.stringify(fullResponse)}`, fullResponse);
        // const updatedResponseObject = {
        //   type: JSON.parse(fullResponse).type,
        //   data: fullResponse,
        //   metadata: JSON.parse(fullResponse).metadata,
        // };
        // const response = JSON.stringify({ content: JSON.parse(fullResponse), complete: true });
        const response = JSON.stringify({ content: fullResponse});
        logger.info(`response response: ${response}`, response);

        // res.write(`data: ${response}\n\n`);

        const assistantMessageId = await createMessage(
          chatSession._id,
          'assistant',
          fullResponse,
          userId,
          chatSession.messages.length + 1
        );
        chatSession.messages.push(assistantMessageId);
        await chatSession.save();

        const docs = [{ pageContent: prompt, metadata: { chatId: sessionId, chatSession, role } }];
        await vectorStore.addDocuments(docs, { namespace });
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
    // res.setHeader('Transfer-Encoding', 'chunked');
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
// const buildPromptFromTemplate = async (previousMessages, prompt) => {
//   try {
//     const chatPrompt = ChatPromptTemplate.fromPromptMessages([
//       HumanMessagePromptTemplate.fromTemplate(
//         'Please respond to the following prompt using JSON formatting: {prompt}\n' +
//           'Remember to use appropriate json elements to structure your response.\n' +
//           'Previous conversation context: {previousMessages}'
//       ),
//     ]);
//     const formattedPrompt = await chatPrompt.formatMessages({
//       prompt: prompt,
//       previousMessages: previousMessages,
//     });
//     return formattedPrompt;
//   } catch (error) {
//     throw new Error(`Error building prompt from template: ${error.message}`);
//   }
// };
// class StreamResponseHandler {
//   constructor() {
//     this.fullResponse = '';
//     this.currentSectionIndex = 0;
//     this.currentSectionType = '';
//     this.currentSectionContent = '';
//     this.currentSection = `{}`;
//     this.sections = [];
//     this.batchedChunks = [];
//     this.concatenatedBatchChunks = '';
//     this.isInSection = false;
//     this.jsonResponse = null;
//     this.formattedContent = '';
//     this.concatenatedChunksToSection = `
//       {
//        'type': 'h1',
//        'content': '',
//         'index': 0
//       }
//     `;
//     this.parsedChunks = [];
//   }
//   // --- handlers ---
//   // extractContent(chunk) {
//   //   return chunk.choices[0]?.delta?.content || '';
//   // }
//   handleChunk(chunk) {
//     const content = extractContent(chunk);

//     try {
//       logger.debug(`Received chunk: ${JSON.stringify(chunk, null, 2)}`, chunk);
//       logger.debug(`Received content: ${JSON.stringify(content)}`, content);

//       // --- ---
//       this.fullResponse += content;

//       // Parse the chunk content
//       const parsedChunkContent = parseContent(content);
//       logger.debug(`Parsed chunk content: ${JSON.stringify(parsedChunkContent)}`, parsedChunkContent);
//       this.parsedChunks.push(parsedChunkContent);

//       // Check for section start
//       if (content.includes('ST-')) {
//         this.isInSection = true;
//         this.currentSectionContent = '';
//         this.concatenatedChunksToSection = '';
//       }

//       // Append content if we are within a section
//       if (this.isInSection) {
//         this.currentSectionContent += content;
//       }

//       // Check for section end
//       if (content.includes('-EN')) {
//         this.isInSection = false;
//         logger.info('Section content:', this.currentSectionContent);
//         this.tryParseSections(this.currentSectionContent);
//         this.currentSectionContent = '';
//       }
//       this.tryParseJsonResponse();
//       this.formattedContent = parseContent(this.fullResponse);

//       return content;
//     } catch (error) {
//       console.error('Error handling chunk:', error);
//       throw error;
//     }
//   }
//   handleBatchChunk(chunk) {
//     const batchSize = 10; // Adjust the batch size as needed

//     try {
//       // const content = this.extractContent(chunk);
//       this.batchedChunks.push(chunk);
//       const batchContentString = processChunkBatch(batchedChunks);
//       if (batchedChunks.length >= batchSize) {
//         batchedChunks.length = 0;
//         this.concatenatedBatchChunks = batchContentString;
//         return batchContentString;
//       }
//       // const batchContent = this.batchedChunks.join('');
//       // this.batchedChunks = [];
//       return batchContent;
//     } catch (error) {
//       console.error('Error handling batch chunk:', error);
//       throw error;
//     }
//   }
//   // --- tryers ---
//   tryParseJsonResponse() {
//     try {
// const jsonObject = JSON.parse(this.fullResponse);
// // Parse each section in the JSON response
// this.jsonResponse = jsonObject.map(section => parseContent(JSON.stringify(section)));
//     } catch (error) {
//       // If parsing fails, it's likely not complete JSON yet
//       logger.debug('Full response is not valid JSON yet');
//     }
//   }
//   tryParseSections(sectionContent) {
//     try {
//       const sectionData = JSON.parse(sectionContent);
//       this.sections.push(parseContent(JSON.stringify(sectionData)));
//     } catch (error) {
//       console.error('Error parsing section:', error);
//       // If JSON parsing fails, store the raw content
//       this.sections.push({ rawContent: parseContent(sectionContent) });
//     }
//   }
//   tryParseJSON() {
//     try {
//       this.jsonResponse = JSON.parse(this.fullResponse);
//     } catch (error) {
//       // If parsing fails, it means the JSON is incomplete or invalid
//     }
//   }
//   // --- getters ---
//   getFormattedResponse() {
//     return this.formattedContent;
//   }
//   getFullResponse() {
//     return this.fullResponse;
//   }
//   getSections() {
//     return this.sections;
//   }
//   getParsedChunks() {
//     return this.parsedChunks;
//   }
//   // --- splitters ---
//   splitResponse(option) {
//     switch (option) {
//       case 'byParagraph':
//         return this.splitByParagraph(this.fullResponse);
//       case 'bySentence':
//         return this.splitBySentence(this.fullResponse);
//       case 'byHTML':
//         return this.splitByHTML(this.fullResponse);
//       case 'bySection':
//         return this.splitBySection(this.fullResponse);
//       case 'byType':
//         return this.splitByType(this.fullResponse);
//       default:
//         return [this.fullResponse];
//     }
//   }
//   splitByHTML(content) {
//     // Regular expression to match HTML tags
//     const regex = /<[^>]+>/g;
//     const matches = content.match(regex);

//     // If there are no matches, return the original content
//     if (!matches) {
//       return [content];
//     }

//     const sections = [];
//     let currentSection = '';

//     // Iterate through the matches and add sections to the sections array
//     matches.forEach(match => {
//       if (match.startsWith('<') && match.endsWith('>')) {
//         // If the match is an HTML tag, check if we're already in a section
//         if (currentSection.length > 0) {
//           sections.push(currentSection);
//           currentSection = '';
//         }
//       } else {
//         // If the match is not an HTML tag, append it to the current section
//         currentSection += match;
//       }
//     });

//     // Add the last section if it exists
//     if (currentSection.length > 0) {
//       sections.push(currentSection);
//     }

//     return sections;
//   }
//   splitBySection(content) {
//     // Split content into sections based on section markers
//     const sections = [];
//     let currentSection = '';

//     this.splitByHTML(content).forEach(section => {
//       if (section.includes('ST') && section.includes('EN')) {
//         sections.push(currentSection);
//         currentSection = '';
//       } else {
//         currentSection += section;
//       }
//     });

//     // Add the last section if it exists
//     if (currentSection.length > 0) {
//       sections.push(currentSection);
//     }

//     return sections;
//   }
//   splitByType(content) {
//     // Split content into sections based on type
//     const sectionsByType = {};

//     this.splitByHTML(content).forEach(section => {
//       const typeMatch = section.match(/<([a-z]+)\b[^>]*>(.*?)<\/\1>/i);
//       if (typeMatch) {
//         const type = typeMatch[1].toLowerCase();
//         if (!sectionsByType[type]) {
//           sectionsByType[type] = [];
//         }
//         sectionsByType[type].push(typeMatch[2]);
//       }
//     });

//     return sectionsByType;
//   }
//   splitByParagraph(content) {
//     return content.split('\n\n');
//   }
//   splitBySentence(content) {
//     return content.match(/[^.!?]+[.!?]+/g) || [];
//   }
//   // --- other ---
//   isResponseComplete() {
//     return this.jsonResponse !== null;
//   }
//   extractSections(parsedContent) {
//     try {
//       // Extract sections from the parsed content if possible
//       const sectionData = JSON.parse(parsedContent);
//       this.sections.push(parseContent(JSON.stringify(sectionData)));
//     } catch (error) {
//       logger.error('Error extracting sections:', error);
//       // Store raw content if parsing fails
//       this.sections.push({ rawContent: parsedContent });
//     }
//   }
// }

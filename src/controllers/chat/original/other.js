const { User, Model, ChatFile, ChatSession, Message } = require('../../../models');
const { default: OpenAI } = require('openai');
const { PineconeStore } = require('@langchain/pinecone');
const { OpenAIEmbeddings, ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const {
  getEnv,
  checkApiKey,
  createOrRetrievePineconeIndex,
  setSSEHeader,
  createPineconeIndex,
} = require('../../../utils');
const logger = require('../../../config/logging/index.js');
const { Pinecone } = require('@pinecone-database/pinecone');
const { MongoDBChatMessageHistory } = require('@langchain/mongodb');
// const { Readable } = require('openai/_shims/auto/types');
const { Readable } = require('stream');

// --- INITIALIZE COMPONENTS ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// --- HELPER FUNCTIONS ---
const getSessionMessages = async sessionId => {
  try {
    const chatSession = await ChatSession.findById(sessionId).populate('messages');
    if (!chatSession) {
      throw new Error('Chat session not found');
    }

    const messagePromises = chatSession.messages.map(async msg => {
      const foundMessage = await Message.findById(msg);
      if (foundMessage) {
        return {
          _id: foundMessage._id,
          role: foundMessage.role,
          content: foundMessage.content,
        };
      }
      return null;
    });

    let chatMessages = await Promise.all(messagePromises);

    // Filter out null and duplicate messages by content
    chatMessages = chatMessages.filter(
      (msg, index, self) => msg && index === self.findIndex(m => m.content === msg.content)
    );

    console.log('Fetched session messages:', chatMessages);

    // Replace the current system prompt with the new one from createSystemPromptB
    const systemPrompt = createSystemPromptB();
    const systemMessageIndex = chatMessages.findIndex(msg => msg.role === 'system');
    if (systemMessageIndex !== -1) {
      // Update existing system message
      await Message.findByIdAndUpdate(chatMessages[systemMessageIndex]._id, { content: systemPrompt });
      chatMessages[systemMessageIndex].content = systemPrompt;
    } else {
      // Create new system message if none exists
      const newSystemMessage = {
        role: 'system',
        content: systemPrompt,
      };
      chatMessages.unshift(newSystemMessage);
      const systemMessageId = await createMessage(sessionId, 'system', systemPrompt, null, 1);
      chatSession.messages.unshift(systemMessageId);
      await chatSession.save();
    }

    return chatMessages;
  } catch (error) {
    console.error('Error fetching session messages:', error);
    throw error;
  }
};

// --- RESPONSE HANDLER ---
class StreamResponseHandler {
  constructor() {
    this.fullResponse = '';
    this.sections = [];
    this.currentSection = null;
    this.currentSectionContent = '';
    this.isInSection = false;
  }

  handleChunk(chunk) {
    const content = chunk.choices[0]?.delta?.content || '';
    this.fullResponse += content;

    // Check for section start
    if (content.includes('START_SECTION--')) {
      this.isInSection = true;
      this.currentSectionContent = '';
    }

    // Append content if we are within a section
    if (this.isInSection) {
      this.currentSectionContent += content;
    }

    // Check for section end
    if (content.includes('--END_SECTION')) {
      this.isInSection = false;
      this.tryParseSections(this.currentSectionContent);
      this.currentSectionContent = '';
    }

    return content;
  }

  tryParseSections(sectionContent) {
    // This function attempts to parse the content into structured sections.
    try {
      // Remove the section markers and trim the content
      const cleanedContent = sectionContent.replace(/(START_SECTION--|--END_SECTION)/g, '').trim();

      // Find section type (h1, h2, p, etc.)
      const typeMatch = cleanedContent.match(/<([a-z]+)\b[^>]*>/i);
      const type = typeMatch ? typeMatch[1].toLowerCase() : 'text';

      // Extract the inner content
      const contentMatch = cleanedContent.match(/<[^>]+>(.*)<\/[^>]+>/is);
      const content = contentMatch ? contentMatch[1] : cleanedContent;

      // Push the parsed section into the sections array
      this.sections.push({
        index: this.sections.length + 1,
        type: type,
        content: content,
      });
    } catch (error) {
      console.log('Error parsing section:', error);
    }
  }

  // tryParseJSON() {
  //   try {
  //     this.jsonResponse = JSON.parse(this.fullResponse);
  //   } catch (error) {
  //     // If parsing fails, it means the JSON is incomplete or invalid
  //   }
  // }

  isResponseComplete() {
    return;
  }

  getFullResponse() {
    return this.fullResponse;
  }

  getSections() {
    return this.sections;
  }

  splitResponse(option) {
    switch (option) {
      case 'byParagraph':
        return this.splitByParagraph(this.fullResponse);
      case 'bySentence':
        return this.splitBySentence(this.fullResponse);
      case 'byHTML':
        return this.splitByHTML(this.fullResponse);
      case 'bySection':
        return this.splitBySection(this.fullResponse);
      case 'byType':
        return this.splitByType(this.fullResponse);
      default:
        return [this.fullResponse];
    }
  }

  splitByHTML(content) {
    // Regular expression to match HTML tags
    const regex = /<[^>]+>/g;
    const matches = content.match(regex);

    // If there are no matches, return the original content
    if (!matches) {
      return [content];
    }

    const sections = [];
    let currentSection = '';

    // Iterate through the matches and add sections to the sections array
    matches.forEach(match => {
      if (match.startsWith('<') && match.endsWith('>')) {
        // If the match is an HTML tag, check if we're already in a section
        if (currentSection.length > 0) {
          sections.push(currentSection);
          currentSection = '';
        }
      } else {
        // If the match is not an HTML tag, append it to the current section
        currentSection += match;
      }
    });

    // Add the last section if it exists
    if (currentSection.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  }

  splitBySection(content) {
    // Split content into sections based on section markers
    const sections = [];
    let currentSection = '';

    this.splitByHTML(content).forEach(section => {
      if (section.includes('START_SECTION') && section.includes('END_SECTION')) {
        sections.push(currentSection);
        currentSection = '';
      } else {
        currentSection += section;
      }
    });

    // Add the last section if it exists
    if (currentSection.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  }

  splitByType(content) {
    // Split content into sections based on type
    const sectionsByType = {};

    this.splitByHTML(content).forEach(section => {
      const typeMatch = section.match(/<([a-z]+)\b[^>]*>(.*?)<\/\1>/i);
      if (typeMatch) {
        const type = typeMatch[1].toLowerCase();
        if (!sectionsByType[type]) {
          sectionsByType[type] = [];
        }
        sectionsByType[type].push(typeMatch[2]);
      }
    });

    return sectionsByType;
  }

  splitByParagraph(content) {
    return content.split('\n\n');
  }

  splitBySentence(content) {
    return content.match(/[^.!?]+[.!?]+/g) || [];
  }
}

const chunkCompletionResponse = completionResponse => {
  // Helper function to extract sections
  const extractSections = text => {
    const sections = [];
    const sectionPattern = /START_SECTION--(.*?)--END_SECTION/g;
    let match;
    let index = 1;

    while ((match = sectionPattern.exec(text)) !== null) {
      sections.push({
        index: index++,
        content: match[1].trim(),
      });
    }

    return sections;
  };
};
// Process the completion response
const processResponse = response => {
  const sections = extractSections(response);

  // Determine the type of each section based on content
  const determineType = content => {
    if (content.startsWith('<h1>')) return 'h1';
    if (content.startsWith('<h2>')) return 'h2';
    if (content.startsWith('<p>')) return 'p';
    if (content.startsWith('<blockquote>')) return 'blockquote';
    if (content.startsWith('<a')) return 'a';
    if (content.startsWith('<img')) return 'img';
    if (content.startsWith('<pre')) return 'pre';
    if (content.startsWith('<code')) return 'code';
    if (content.startsWith('<ul>')) return 'ul';
    if (content.startsWith('<ol>')) return 'ol';
    return 'text';
  };

  const chunkedResponse = {
    type: 'json',
    data: {
      sections: sections.map((section, index) => ({
        index: section.index,
        type: determineType(section.content),
        content: section.content,
      })),
    },
    metadata: {
      timestamp: new Date().toISOString(),
      content_length: response.length,
      content_type: 'application/json',
    },
  };

  return chunkedResponse;
};
// The response must include the following:
// - \`type\`: A string indicating the type of content, e.g., 'code', 'markdown', 'text'.
// - \`data\`: An object containing the content specific to the type.
// - \`metadata\`: An object containing additional information about the response, e.g., 'timestamp', 'content_length', 'content_type'.

const createSystemPromptB = () => {
  return `
  Please generate a structured JSON response with the following format:

  INSTRUCTIONS:
  - MAIN CONTENT:
    - \`type\`: A string indicating the type of content, e.g., 'code', 'markdown', 'text'.
    - \`data\`: An object containing the formatted sections.
    - \`metadata\`: An object with additional details like 'timestamp', 'content_length', and 'content_type'.

  - SECTIONS (data.sections):
    - An array of objects, each representing a section of the response.
    - Each object must have:
      - \`index\`: A number indicating the section order.
      - \`type\`: A string for the HTML element type (e.g., 'h1', 'p', 'blockquote').
      - \`content\`: A string with the section content, wrapped between 'START_SECTION--' and '--END_SECTION'.

  - HTML ELEMENTS:
    - Use 'h1', 'h2', 'p', 'blockquote', 'a', 'img', 'pre', 'code', 'ul', 'ol', and 'table'.
    - Attributes:
      - \`a\`: Must have a 'href' attribute.
      - \`img\`: Must have an 'alt' attribute.
      - \`pre\` and \`code\`: Should include 'class' attributes for styling.

  - ADDITIONAL GUIDELINES:
    - The \`h1\` should summarize the user's prompt.
    - The \`h2\` should provide an overview of the response.
    - The \`p\` should contain the main content.
    - The \`blockquote\` should highlight key points.
    - The \`a\` should provide links.
    - The \`img\` should include relevant images with descriptions.
    - The \`pre\` and \`code\` should present code snippets.
    - The \`ul\` and \`ol\` should list items.

  Example:
  {
    "type": "json",
    "data": {
      "sections": [
        { "index": 1, "type": "h1", "content": "START_SECTION--Title--END_SECTION" },
        { "index": 2, "type": "h2", "content": "START_SECTION--Overview--END_SECTION" },
        { "index": 3, "type": "p", "content": "START_SECTION--Main content--END_SECTION" },
        { "index": 4, "type": "blockquote", "content": "START_SECTION--Key points--END_SECTION" },
        { "index": 5, "type": "pre", "content": "START_SECTION--<pre class='code-block'><code class='code'>Code snippet</code></pre>--END_SECTION" },
        { "index": 6, "type": "ul", "content": "START_SECTION--<ul><li>Item 1</li><li>Item 2</li></ul>--END_SECTION" },
        { "index": 7, "type": "a", "content": "START_SECTION--<a href='https://example.com'>Link</a>--END_SECTION" },
        { "index": 8, "type": "img", "content": "START_SECTION--<img src='https://example.com/image.png' alt='Description' />--END_SECTION" }
      ]
    },
    "metadata": {
      "timestamp": "2024-07-16T12:00:00Z",
      "content_length": 300,
      "content_type": "application/json"
    }
  }`;
};

const createMessage = async (sessionId, role, content, userId, sequenceNumber) => {
  const message = new Message({
    sessionId,
    role,
    content,
    userId,
    // tokens: content.split(' ').length
    sequenceNumber,
    metaData: {},
  });
  await message.save();
  return message._id;
};

const initializeChatSession = async (sessionId, userId) => {
  let chatSession = await ChatSession.findById({
    _id: sessionId,
  });
  if (!chatSession) {
    chatSession = new ChatSession({
      name: `Chat ${sessionId}`,
      userId,
      topic: 'New Chat',
      active: true,
      model: 'gpt-4-1106-preview',
      settings: {
        maxTokens: 1000,
        temperature: 0.7,
        topP: 1.0,
        n: 1,
      },
      messages: [],
      tuning: {
        debug: false,
        summary: '',
        summarizeMode: false,
      },
    });
    logger.info(`Created new chat session: ${chatSession._id}`);
    await chatSession.save();
  }

  // CLEAR PREVIOUS CHAT HISTOR
  await Message.deleteMany({ sessionId: chatSession._id });
  await chatSession.updateOne({}, { $set: { messages: [] } });

  // SAVE CLEARED CHAT HISTORY
  await chatSession.save();
  return chatSession;
};
const withStreaming = async (messages, formattedPrompt) => {
  return new Readable({
    async read() {
      try {
        // const stream = await openai.chat.completions.create({
        //   ...params,
        //   stream: true,
        // });
        const stream = await openai.chat.completions.create({
          model: 'gpt-4-1106-preview',
          messages: [...messages, { role: 'user', content: formattedPrompt }],
          stream: true,
          response_format: { type: 'json_object' },
          // response_format: { type: 'text' }, // Changed to 'text' to allow Markdown formatting
        });

        for await (const part of stream) {
          const chunk = part.choices[0]?.delta?.content || '';
          this.push(chunk);
        }
        this.push(null);
      } catch (error) {
        this.emit('error', error);
      }
    },
  });
};
// --- MAIN FUNCTION ---
const withChatCompletion = async data => {
  const { apiKey, pineconeIndex, namespace, prompt, sessionId, userId, role, stream, res } = data;
  try {
    // [INIT SESSION]
    const chatSession = await initializeChatSession(sessionId, userId);
    console.log(`CHAT SESSION: ${JSON.stringify(chatSession)}`);
    // [MONGODB HISTORY INIT]
    const chatHistory = new MongoDBChatMessageHistory({
      collection: Message.collection, // Use your existing Message collection
      sessionId: chatSession._id,
    });
    console.log(`CHAT HISTORY: ${JSON.stringify(chatHistory)}`);

    const messages = (await getSessionMessages(chatSession._id)) || [];
    console.log(`CHAT: ${JSON.stringify(messages)}`);
    if (messages.length === 0) {
      const systemPrompt = createSystemPromptB();
      console.log(`Created system prompt: ${systemPrompt}`);
      const systemMessageId = await createMessage(chatSession._id, 'system', systemPrompt, userId, 1);
      console.log(`Created system message: ${systemMessageId}`);
      chatSession.messages.push(systemMessageId);
      await chatSession.save();
    }

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

    const previousMessages = messages
      .slice(1)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    // [PROMPT TEMPLATE SETUP]
    const promptTemplate = new PromptTemplate({
      template: {
        input: `Please respond to the following prompt using JSON formatting: ${prompt}
      Remember to use appropriate json elements to structure your response.
      Previous conversation context:`,
      }.input,
      inputVariables: ['previousMessages', 'prompt'],
    });
    const formattedPrompt = await promptTemplate.format({
      previousMessages,
      userPrompt: prompt,
    });

    // [STREAM COMPLETION STREAMING]
    // const stream = await withStreaming(messages, formattedPrompt);
    // // stream.on('data', chunk => {
    // //   res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    // // });
    // stream.on('data', chunk => {
    //   res.write(`data: ${chunk}\n\n`);
    // });
    // const responseHandler = new StreamResponseHandler();

    // [OPENAI CHAT COMPLETION]
    // const completion = await openai.chat.completions.create({
    //   model: 'gpt-4-1106-preview',
    //   messages: [...messages, { role: 'user', content: formattedPrompt }],
    //   stream: true,
    //   response_format: { type: 'json_object' },
    //   // response_format: { type: 'text' }, // Changed to 'text' to allow Markdown formatting
    // });
    // Process each chunk from the streamed response
    // for await (const chunk of completion) {
    //   responseHandler.handleChunk(chunk);

    //   // Check if a section is complete and ready to be sent to the client
    //   const sections = responseHandler.getSections();
    //   if (sections.length > 0) {
    //     for (const section of sections) {
    //       // Send the complete section to the client
    //       res.write(`data: ${JSON.stringify(section)}\n\n`);
    //     }
    //     // Clear the sections array after sending
    //     responseHandler.sections = [];
    //   }
    // }

    // // Get the completed sections from the response handler
    // const finalSections = responseHandler.getSections();
    // for (const section of finalSections) {
    //   res.write(`data: ${JSON.stringify(section)}\n\n`);
    // }
    // const assistantMessageId = await createMessage(
    //   chatSession._id,
    //   'assistant',
    //   responseHandler.getFullResponse(),
    //   userId,
    //   chatSession.messages.length + 1
    // );
    // chatSession.messages.push(assistantMessageId);
    // await chatSession.save();

    // [ADD DOCUMENTS TO VECTOR STORE]
    // const docs = [{ pageContent: prompt, metadata: { chatId: sessionId, chatSession, role } }];
    // await vectorStore.addDocuments(docs, { namespace });
    return { formattedPrompt, messages, chatSession };
  } catch (error) {
    logger.error('Error in withChatCompletion:', error);
    throw error;
  }
};

const chatStream = async (req, res) => {
  console.log(`REQUEST BODY: ${JSON.stringify(req.body)}`);
  const { sessionId, chatId, prompt, userId, clientApiKey, role } = req.body;
  const initializationData = {
    apiKey: clientApiKey || process.env.OPENAI_API_KEY,
    pineconeIndex: getEnv('PINECONE_INDEX'),
    namespace: getEnv('PINECONE_NAMESPACE'),
    embeddingModel: getEnv('EMBEDDING_MODEL'),
    dimensions: parseInt(getEnv('EMBEDDING_MODEL_DIMENSIONS')),
    completionModel: getEnv('OPENAI_CHAT_COMPLETION_MODEL'),
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
    // flush
    res.flushHeaders();
    const { formattedPrompt, messages, chatSession } = await withChatCompletion(initializationData);

    const stream = await withStreaming(messages, formattedPrompt);
    // stream.on('data', chunk => {
    //   res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    // });
    stream.on('data', chunk => {
      res.write(`data: ${chunk}\n\n`);
    });

    stream.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.status(500).json({ error: 'An error occurred during streaming' });
    });

    const assistantMessageId = await createMessage(
      chatSession._id,
      'assistant',
      responseHandler.getFullResponse(),
      userId,
      chatSession.messages.length + 1
    );
    chatSession.messages.push(assistantMessageId);
    await chatSession.save();


  } catch (error) {
    logger.error(`Error in chatStream: ${error}`);
    if (!res.headersSent) {
      res.status(500).json({ error: 'An error occurred while processing the chat stream' });
    }
  }
  // } finally {
  //   res.write('data: [DONE]\n\n');
  //   res.end();
  // }
};
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

// const createSystemPromptA = () => {
//   return `You are a helpful AI assistant. Create an absolutely consistent JSON response format for the chat bot app server stream response endpoint. Ensure specific structures are followed for different file types such as code, markdown, text, etc. The response must include the following components:
// - \`status\`: A string indicating the status of the response, e.g., 'success' or 'error'.
// - \`type\`: A string indicating the type of content, e.g., 'code', 'markdown', 'text'.
// - \`data\`: An object containing the content specific to the type.
// - \`metadata\`: An object containing additional information about the response, e.g., 'timestamp', 'content_length', 'content_type'.

// The \`data\` object should have the following structure based on the \`type\`:
// - For \`code\` type:
//   \`\`\`json
//   {
//     "language": "string",
//     "content": "string"
//   }
//   \`\`\`
// - For \`markdown\` type:
//   \`\`\`json
//   {
//     "content": "string"
//   }
//   \`\`\`
// - For \`text\` type:
//   \`\`\`json
//   {
//     "content": "string"
//   }
//   \`\`\`

// Example JSON response:
// \`\`\`json
// {
//   "status": "success",
//   "type": "code",
//   "data": {
//     "language": "javascript",
//     "content": "const x = 10;"
//   },
//   "metadata": {
//     "timestamp": "2024-07-16T12:00:00Z",
//     "content_length": 15,
//     "content_type": "application/javascript"
//   }
// }
// \`\`\`

// Ensure the response format is consistent and includes all necessary fields as specified. Handle errors gracefully with an appropriate status and error message in the metadata.`;
// };

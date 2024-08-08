const logger = require('../../config/logging/index.js');
const { streamWithCompletion } = require('../../utils/ai/chat/streaming.js');
const { getEnv } = require('../../utils/api/env.js');
const { checkApiKey } = require('../../utils/auth/user.js');

// --- CHAT STREAM ---
const chatStream = async (req, res) => {
  logger.info(`REQUEST BODY: ${JSON.stringify(req.body)}`);
  const { sessionId, workspaceId, regenerate, prompt, userId, clientApiKey, role } = req.body;
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
    providedWorkspaceId: workspaceId,
    providedSessionId: sessionId,
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
    await streamWithCompletion(initializationData);
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
// // --- RESPONSE HANDLER ---
// class StreamResponseHandler {
//   constructor() {
//     this.fullResponse = '';
//     this.parsedChunks = [];
//   }

//   handleChunk(chunk) {
//     const content = extractContent(chunk);
//     this.fullResponse += content;
//     const parsedChunkContent = parseContent(content);
//     this.parsedChunks.push(parsedChunkContent);
//     return content;
//   }

//   isResponseComplete() {
//     try {
//       JSON.parse(this.fullResponse);
//       return true;
//     } catch {
//       return false;
//     }
//   }

//   getFullResponse() {
//     return this.fullResponse;
//   }

//   getParsedChunks() {
//     return this.parsedChunks;
//   }
// }

// // --- SUMMARIZE MESSAGES ---
// async function summarizeMessages(messages, openai) {
//   const summarizeFunction = {
//     name: 'summarize_messages',
//     description: 'Summarize a list of chat messages',
//     parameters: {
//       type: 'object',
//       properties: {
//         summary: {
//           type: 'string',
//           description: 'A concise summary of the chat messages',
//         },
//       },
//       required: ['summary'],
//     },
//   };

//   const response = await openai.completionWithRetry({
//     model: 'gpt-3.5-turbo',
//     messages: [
//       { role: 'system', content: 'You are a helpful assistant that summarizes chat messages.' },
//       {
//         role: 'user',
//         content: `Summarize these messages. Give an overview of each message: ${JSON.stringify(messages)}`,
//       },
//     ],
//     functions: [summarizeFunction],
//     function_call: { name: 'summarize_messages' },
//   });

//   const functionCall = response.choices[0].message.function_call;
//   if (functionCall && functionCall.name === 'summarize_messages') {
//     return JSON.parse(functionCall.arguments).summary;
//   }
//   return 'Unable to generate summary';
// }

// // --- MAIN FUNCTION ---
// const streamWithCompletion = async data => {
//   const { apiKey, pineconeIndex, completionModel, namespace, prompt, sessionId, userId, role, stream, res } = data;

//   try {
//     // [INIT SESSION]
//     let sessionId = providedSessionId;
//     if (!sessionId) {
//       const newSession = await ChatSession.create({ userId });
//       sessionId = newSession._id.toString();
//     }
//     const chatSession = await initializeChatSession(sessionId, userId);
//     // [INIT OPENAI]
//     const chatOpenAI = new ChatOpenAI({
//       modelName: completionModel,
//       temperature: chatSession.settings.temperature,
//       maxTokens: chatSession.settings.maxTokens,
//       topP: chatSession.settings.topP,
//       n: chatSession.settings.n,
//       streaming: true,
//       openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
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
//     });
//     // [INIT PINECONE]
//     const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
//     // [INIT LANGCHAIN EMBEDDINGS]
//     const embedder = new OpenAIEmbeddings({
//       modelName: 'text-embedding-3-small',
//       apiKey: apiKey || process.env.OPENAI_API_KEY,
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
//     logger.info(`SUMMARY: ${summary}`);
//     await chatHistory.addUserMessage(prompt);
//     const newUserMessageId = await createMessage(
//       chatSession._id,
//       'user',
//       prompt,
//       userId,
//       chatSession.messages.length + 1
//     );
//     chatSession.messages.push(newUserMessageId);
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
//       const chunkContent = await responseHandler.handleChunk(chunk);
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
// // --- ASSISTANT RESPONSE HANDLER ---
// const assistantChatStream = async (req, res) => {
//   const assistantIdToUse = 'asst_swKHIz2VerOTdps3oX6bJhqi'; // Replace with your assistant ID
//   const userId = req.body.userId; // Include the user ID in the request
//   const assistantId = assistantIdToUse;

//   // Create a new thread if it's the user's first message
//   if (!threadByUser[userId]) {
//     try {
//       const myThread = await openai.beta.threads.create();
//       console.log('New thread created with ID: ', myThread.id);
//       threadByUser[userId] = myThread.id; // Store the thread ID for this user
//     } catch (error) {
//       console.error('Error creating thread:', error);
//       res.status(500).json({ error: 'Internal server error' });
//       return;
//     }
//   }

//   const userMessage = req.body.message;

//   // Add a Message to the Thread
//   try {
//     const myThreadMessage = await openai.beta.threads.messages.create(
//       threadByUser[userId], // Use the stored thread ID for this user
//       {
//         role: 'user',
//         content: userMessage,
//         file_ids: uploadedFileIds, // Include file_ids inside the message object
//       }
//     );
//     console.log('Message object: ', myThreadMessage);

//     // Run the Assistant
//     const myRun = await openai.beta.threads.runs.create(
//       threadByUser[userId], // Use the stored thread ID for this user
//       {
//         assistant_id: assistantIdToUse,
//         instructions:
//           'You are an AI Private Investigator tasked with gathering information on a specific object thing or person. Your mission is to collect comprehensive details including but not limited to the followingObject/Thing/Person Clearly identify the object thing or person you are investigating.Background Research and provide background information on the subject. This could include their history associations and any relevant context.Contact Information If applicable find and report any available contact information such as email addresses phone numbers or social media profiles.Physical Description Describe the physical appearance of the subject including any distinguishing features.Location Determine the current or last-known location of the subject.Associations Investigate and document any known associations or relationships the subject has with other individuals or entities.Legal Information If relevant uncover any legal records including criminal records lawsuits or court proceedings.Online Presence Search for and report any online presence or digital footprint including websites social media activity and online publications.Financial Information If applicable gather information on the financial status including income assets and liabilities.Additional Information Collect any other pertinent information that may aid in the investigation.Your goal is to compile a comprehensive dossier by utilizing your investigative skills and available resources. Ensure accuracy and thoroughness in your findings.Looking for email,phone number,images etc. Please Dont include obituary results',
//         tools: tools,
//         // Include the file IDs in the request
//       }
//     );
//     console.log('Run object: ', myRun);

//     // Check and print messages
//     const intervalId = setInterval(async () => {
//       try {
//         const runStatus = await openai.beta.threads.runs.retrieve(threadByUser[userId], myRun.id);

//         if (runStatus.status === 'completed' || runStatus.status === 'failed') {
//           const messages = await openai.beta.threads.messages.list(threadByUser[userId]);

//           messages.data.forEach(async msg => {
//             const contentType = msg.content[0].type;

//             if (contentType === 'text') {
//               // Check if there are annotations and if the first annotation is a file path
//               const annotations = msg.content[0].text.annotations;
//               if (annotations && annotations.length > 0 && annotations[0].type === 'file_path') {
//                 const fileAnnotation = annotations[0];
//                 console.log('File path annotation:', fileAnnotation);

//                 // If there's a file_id, handle the file download
//                 if (fileAnnotation.file_path && fileAnnotation.file_path.file_id) {
//                   const fileId = fileAnnotation.file_path.file_id;
//                   const filePath = `./downloads/${fileId}`; // You may need to determine the correct file extension

//                   // Download the file using the fileId and save it to the specified path
//                   await downloadFile(fileId, filePath);
//                 }
//               } else {
//                 // Handle normal text content
//                 const textContent = msg.content[0].text.value;
//                 console.log('Text content:', textContent);
//               }
//             } else if (contentType === 'image_file') {
//               const fileId = msg.content[0].image_file.file_id;
//               console.log('Image file ID:', fileId);

//               // Define the file download path on your server
//               const filePath = `./downloads/${fileId}.png`; // Change the extension based on the file type

//               // Download the file using the fileId and save it to the specified path
//               await downloadFile(fileId, filePath);
//             }
//           });

//           clearInterval(intervalId);
//           console.log(messages.data[0].content[0].type.file_id);
//           // Extract the bot's latest message
//           if (messages.data[0].content[0].type === 'text') {
//             const latestBotMessage = messages.data[0].content[0].text.value;
//             res.json({ message: latestBotMessage });
//           } else if (messages.data[0].content[0].type === 'image_file') {
//             const imageFileId = messages.data[0].content[0].image_file.file_id;
//             // You may need to send a URL or some identifier to the front end
//             res.json({ imageFileId: imageFileId });
//           }

//           // Send the bot's latest message as a JSON response to the front end
//         } else if (runStatus.status === 'requires_action') {
//           // Handle required actions
//           const requiredActions = runStatus.required_action.submit_tool_outputs.tool_calls;
//           let toolsOutput = [];

//           for (const action of requiredActions) {
//             let output;

//             if (action.function.name === 'fetchSearchResults') {
//               const functionArguments = JSON.parse(action.function.arguments);
//               output = await fetchSearchResults(functionArguments.query);
//             } else if (action.function.name === 'analyzeImage') {
//               const functionArguments = JSON.parse(action.function.arguments);
//               output = await analyzeImage(functionArguments.imageUrl);
//             }
//             // Add more 'else if' statements here for additional tools

//             if (output) {
//               toolsOutput.push({
//                 tool_call_id: action.id,
//                 output: JSON.stringify(output),
//               });
//             }
//           }

//           await openai.beta.threads.runs.submitToolOutputs(threadByUser[userId], myRun.id, {
//             tool_outputs: toolsOutput,
//           });
//         } else {
//           console.log('Run is not completed yet.');
//         }
//       } catch (error) {
//         console.error('Error in interval:', error);
//       }
//     }, 5000);
//   } catch (error) {
//     console.error('Error in /chat endpoint:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

// // --- UPLOAD TO FILE STREAM ---
// const uploadToFileStream = async (req, res) => {
//   if (!req.file) {
//     return res.status(400).send('No file uploaded.');
//   }
//   c
//   try {
//     const fileStream = fs.createReadStream(req.file.path);

//     // Upload the file to OpenAI
//     const openaiFile = await openai.files.create({
//       file: fileStream,
//       purpose: 'assistants', // or 'assistants' depending on your use case
//     });

//     // Store the uploaded file ID for later use
//     uploadedFileIds.push(openaiFile.id);

//     res.json({ message: 'File uploaded successfully', fileId: openaiFile.id });
//     console.log(fileIds);
//     console.log('test' + uploadedFileIds);
//   } catch (error) {
//     console.error('Error uploading file to OpenAI:', error);
//     res.status(500).send('Error processing file.');
//   } finally {
//     fs.unlinkSync(req.file.path); // Clean up the local file
//   }
// };

// // --- EXPORT ---
// module.exports = {
//   chatStream,
//   // uploadToFileStream,
//   // assistantChatStream,
// };
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

const { logger } = require('@/config/logging');
const { openAiApiAssistantService } = require('./assistant');
const { openAiApiFileService } = require('./files');
const { openAiApiMessageService } = require('./messages');
const { openAiApiRunService } = require('./runs');
const { openAiApiThreadService } = require('./thread');
const { getUserOpenaiClient } = require('../get');
const { openAiApiStreamingService } = require('./streaming');
let pollingInterval;
// Initialize OpenAI services
const openai = getUserOpenaiClient(process.env.OPENAI_API_PROJECT_KEY);
const assistantService = openAiApiAssistantService(openai);
const fileService = openAiApiFileService(openai);
const threadService = openAiApiThreadService(openai);
const messageService = openAiApiMessageService(openai);
const runService = openAiApiRunService(openai);
const streamingService = openAiApiStreamingService(openai);
// Utility function to process input
const processInput = async request => {
  try {
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
        'OpenAI-Beta': 'assistants=v1',
      },
      body: JSON.stringify({ assistant_id: 'asst_74SL6VPdELw5pgHXO4cVdxqN', stream: true }),
    });

    if (!runResponse.ok) {
      throw new Error(`HTTP error! status: ${runResponse.status}`);
    }

    const reader = runResponse.body.getReader();
    const decoder = new TextDecoder();

    const handleStreamedResponse = value => {
      const lines = decoder.decode(value).split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('data:')) {
          const data = line.trim().slice(5);
          if (data === '[DONE]') {
            setIsLoading(false);
          } else {
            try {
              const event = JSON.parse(data);
              handleStreamedEvent(event);
            } catch (error) {
              console.error('Error parsing streamed response:', error);
            }
          }
        }
      }
    };

    const readLoop = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        handleStreamedResponse(value);
      }
    };

    await readLoop();
  } catch (error) {
    console.error('Error running thread:', error);
  }
};
// Function to check status and handle completion
const checkingStatus = async (res, threadId, runId) => {
  const runObject = await runService.retrieveRun(threadId, runId);

  const status = runObject.status;
  console.log(runObject);
  console.log('Current status: ' + status);

  if (status === 'completed') {
    clearInterval(pollingInterval);

    const messagesList = await messageService.listMessages(threadId);
    let messages = [];

    messagesList.forEach(message => {
      messages.push(message.content);
    });

    res.json({ messages });
  }
};
// Function to list and check the existence of an assistant
const listAndCheckAssistantExistence = async openai => {
  const existingAssistants = await assistantService.listAssistants();
  if (existingAssistants) {
    logger.info(`Existing assistants: ${JSON.stringify(existingAssistants, null, 2)}`);
  }
  const existingAssistant = existingAssistants.find(assistant => assistant.name === 'CODING_REACT');
  if (!existingAssistant) {
    throw new Error('CODING_REACT assistant does not exist. Please create it first.');
  }
  return existingAssistant;
};
const assistantTest = async (req, res, next) => {
  try {
    logger.info(`REQUEST: ${JSON.stringify(req.body)}`);
    const { prompt, threadId } = req.body;

    if (!prompt || !prompt.length) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required',
      });
    }

    const response = await myAssistant(threadId, prompt);
    return res.status(200).json({
      success: true,
      message: response,
    });
  } catch (err) {
    console.error('Error in assistantTest controller ---->', err);
    next(err);
  }
};
const myAssistant = async (threadId, prompt) => {
  try {
    const openai = getUserOpenaiClient(process.env.OPENAI_API_PROJECT_KEY);

    const file = await openai.files.create({
      file: fs.createReadStream(path.join(__dirname, '@/public/static/chatgpt-prompts-custom.json')),
      purpose: 'assistants',
    });

    const fileIds = [file.id];
    const existingAssistant = await listAndCheckAssistantExistence(openai);
    let assistant;

    if (existingAssistant) {
      logger.info('Assistant already exists:', existingAssistant);
      assistant = existingAssistant; // Return the existing assistant if found
    } else {
      const assistantConfig = {
        name: 'CODING_REACT',
        description: 'Assistant specialized in developing React applications',
        instructions: `You are a highly knowledgeable and proficient assistant specialized in developing React applications. Your expertise includes setting up comprehensive project directories, designing scalable and efficient component architectures, and implementing best practices for state management, UI libraries, and performance optimization. You are familiar with modern tools and libraries such as Material-UI, Redux, React Router, and others.
          When responding to user requests, you should:

          1. Provide detailed explanations and step-by-step guidance.
          2. Offer recommendations based on best practices and modern development standards.
          3. Include considerations for code quality, maintainability, and scalability.
          4. Use clear and concise language that is easy to understand, even for those new to React development.
          5. If applicable, suggest code snippets, directory structures, and architectural patterns.
          6. Ensure that all solutions are up-to-date with the latest version of React and related libraries.

          For example, if a user asks for a project directory structure for a React e-commerce app using Material-UI and Redux, you should provide a comprehensive and well-organized directory structure along with an explanation of the roles of each folder and file. Additionally, include suggestions for component architecture, such as using functional components, hooks, and proper state management.

          Your responses should be helpful, accurate, and tailored to the user's specific needs.
          Remember to always stay up-to-date with the latest React and related libraries and tools.
        `,
        tools: [{ type: 'code_interpreter' }, { type: 'file_search' }],
        tool_resources: {
          code_interpreter: {
            file_ids: fileIds,
          },
          file_search: {
            vector_store_ids: [],
          },
        },
        model: 'gpt-4-1106-preview',
        response_format: 'auto',
        metadata: {},
        temperature: 0.9,
      };

      const newAssistant = await openai.beta.assistants.create(assistantConfig);
      assistant = newAssistant;
    }

    let currentThreadId = threadId;

    if (!currentThreadId || !currentThreadId.length) {
      const thread = await openai.beta.threads.create();
      currentThreadId = thread.id;
    }

    // --- User message --- //
    const message = await openai.beta.threads.messages.create(currentThreadId, {
      role: 'user',
      content: prompt,
    });

    const run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: assistant.id,
      instructions: 'Please address the user as Jane Doe. The user has a premium account.',
    });

    logger.info(`Run created: ${JSON.stringify(run, null, 2)}`);

    const asstRun = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
    logger.info(`Assistant run: ${JSON.stringify(asstRun, null, 2)}`);

    const messages = await openai.beta.threads.messages.list(currentThreadId);
    logger.info(`Messages: ${JSON.stringify(messages, null, 2)}`);

    return messages.data;
  } catch (err) {
    console.error('Error in myAssistant function =====>', err);
    throw err;
  }
};
const listAssistants = async () => {
  try {
    const assistants = await assistantService.listAssistants();
    res.json(assistants);
  } catch (err) {
    next(err);
  }
};

const createAssistant = async (req, res, next) => {
  try {
    const config = req.body;
    const assistant = await assistantService.createAssistant(config);
    res.status(201).json(assistant);
  } catch (err) {
    next(err);
  }
};

const deleteAssistant = async (req, res, next) => {
  try {
    const config = req.body;
    const assistant = await assistantService.deleteAssistant(config);
    res.status(201).json(assistant);
  } catch (err) {
    next(err);
  }
};

const updateAssistant = async (req, res, next) => {
  try {
    const config = req.body;
    const assistant = await assistantService.modifyAssistant(config);
    res.status(201).json(assistant);
  } catch (err) {
    next(err);
  }
};

// Upload File
const uploadFile = async (req, res, next) => {
  try {
    const filePath = req.body.filePath; // Assuming the file path is provided in the request body
    const fileId = await fileService.uploadFile(filePath);
    res.status(201).json({ fileId });
  } catch (err) {
    next(err);
  }
};

// Create Thread
const createThread = async (req, res, next) => {
  try {
    const config = req.body;
    const thread = await threadService.createThread(config);
    res.status(201).json(thread);
  } catch (err) {
    next(err);
  }
};

// Create Message
const createMessage = async (req, res, next) => {
  try {
    const { threadId, config } = req.body;
    const message = await messageService.createMessage(threadId, config);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};

// Create Run
const createRun = async (req, res, next) => {
  try {
    const { threadId, config } = req.body;
    const run = await runService.createRun(threadId, config);
    res.status(201).json(run);
  } catch (err) {
    next(err);
  }
};

// Stream Run
const createRunStream = async (req, res, next) => {
  try {
    const { threadId, config } = req.body;
    const stream = streamingService.streamRun(threadId, config);
    for await (const chunk of stream) {
      res.write(chunk);
    }
    res.end();
  } catch (err) {
    next(err);
  }
};

// Stream Run with Functions
const createRunStreamWithFunctions = async (req, res, next) => {
  try {
    const config = req.body;
    const stream = streamingService.streamThreadAndRun(config);
    for await (const chunk of stream) {
      res.write(chunk);
    }
    res.end();
  } catch (err) {
    next(err);
  }
};

// Retrieve Run
const retrieveRun = async (req, res, next) => {
  try {
    const { threadId, runId } = req.body;
    const run = await runService.retrieveRun(threadId, runId);
    res.status(200).json(run);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves an assistant by thread ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise} - A promise that resolves with the assistant's messages.
 * @throws {Error} - If an error occurs during the retrieval process.
 */
const getAssistantByThreadId = async (req, res, next) => {
  try {
    const threadId = req.body.threadId;
    const prompt = req.body.prompt;
    const openai = getUserOpenaiClient(process.env.OPENAI_API_PROJECT_KEY);
    const { createAssistant } = openAiApiAssistantService(openai);
    const { uploadFile } = openAiApiFileService(openai);
    const { createThread } = openAiApiThreadService(openai);
    const { createMessage, listMessages } = openAiApiMessageService(openai);
    const { createRun, retrieveRun } = openAiApiRunService(openai);
    // -- 1
    const file = await uploadFile(path.join(__dirname, '@/public/static/chatgpt-prompts-custom.json'));
    fileIds.push(file.id);
    const existingAssistant = await listAndCheckAssistantExistence(openai);
    let assistant;
    if (existingAssistant) {
      logger.info('Assistant already exists:', existingAssistant);
      assistant = existingAssistant; // Return the existing assistant if found
    } else {
      const assistantConfig = {
        name: 'CODING_REACT',
        description: 'Assistant specialized in developing React applications',
        instructions: `You are a highly knowledgeable and proficient assistant specialized in developing React applications. Your expertise includes setting up comprehensive project directories, designing scalable and efficient component architectures, and implementing best practices for state management, UI libraries, and performance optimization. You are familiar with modern tools and libraries such as Material-UI, Redux, React Router, and others.
          When responding to user requests, you should:

          1. Provide detailed explanations and step-by-step guidance.
          2. Offer recommendations based on best practices and modern development standards.
          3. Include considerations for code quality, maintainability, and scalability.
          4. Use clear and concise language that is easy to understand, even for those new to React development.
          5. If applicable, suggest code snippets, directory structures, and architectural patterns.
          6. Ensure that all solutions are up-to-date with the latest version of React and related libraries.

          For example, if a user asks for a project directory structure for a React e-commerce app using Material-UI and Redux, you should provide a comprehensive and well-organized directory structure along with an explanation of the roles of each folder and file. Additionally, include suggestions for component architecture, such as using functional components, hooks, and proper state management.

          Your responses should be helpful, accurate, and tailored to the user's specific needs.
          Remember to always stay up-to-date with the latest React and related libraries and tools.
      `,
        tools: [{ type: 'code_interpreter' }, { type: 'file_search' }],
        tool_resources: {
          code_interpreter: {
            file_ids: fileIds,
          },
          file_search: {
            vector_store_ids: [],
          },
        },
        model: 'gpt-4-1106-preview',
        // file_ids: [file.id],
        response_format: 'auto',
        metadata: {},
        temperature: 0.9,
      };
      const newAssistant = await createAssistant(assistantConfig);
      assistant = newAssistant;
    }
    if (!threadId.length) {
      const thread = await createThread();
      threadId = thread.id;
    }
    // --- User message --- //
    const message = await createMessage(threadId, {
      role: 'user',
      content: prompt,
    });
    const run = await createRun(threadId, {
      assistant_id: assistant.id,
      instructions: getMainAssistantMessageInstructions(),
    });
    const asstRun = await retrieveRun(threadId, run.id);
    const status = asstRun.status;
    // const messages = await listMessages(threadId);
    if (status === 'completed') {
      clearInterval(pollingInterval);
      const messagesList = await messageService.listMessages(threadId);
      let messages = [];
      messagesList.forEach(message => {
        messages.push(message.content);
      });
      res.json({ messages });
    }
    // return messages.data;
  } catch (err) {
    console.error('Error in chat bot =====>', err);
    return err;
  }
};
const assistantController = {
  getByThread: getAssistantByThreadId,
  createAssistant,
  deleteAssistant,
  updateAssistant,
  uploadFile,
  createThread,
  createMessage,
  createRun,
  createRunStream,
  createRunStreamWithFunctions,
  retrieveRun,
  listAssistants,
  assistantTest,
};

module.exports = {
  assistantController,
};
// const createAssistant = async (req, res, next) => {
//   try {
//     logger.info(`REQUEST: ${JSON.stringify(req.body)}`);
//     const config = req.body.config;
//     const threadId = req.body.threadId || '';
//     if (prompt.length) {
//       const response = await myAssistant(threadId, prompt);
//       return res.status(200).json({
//         success: true,
//         message: response,
//       });
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: 'Prompt is required',
//       });
//     }
//   } catch (err) {
//     console.error('error in post handler ---->', err);
//     next(err);
//   }
// }

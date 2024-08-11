const express = require('express');
const streamers = require('@/controllers');
const { asyncHandler } = require('@/utils/api');
const { default: OpenAI } = require('openai');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getUserOpenaiClient } = require('@/utils/ai/openAi/get');
const { logger } = require('@/config/logging');
let fileIds = []; // Store file IDs
let uploadedFileIds = []; // Store uploaded file IDs
const listAndCheckAssistantExistence = async openai => {
  const existingAssistants = await openai.beta.assistants.list();
  if (existingAssistants) {
    logger.info(`Existing assistants: ${JSON.stringify(existingAssistants.data, null, 2)}`);
  }
  const existingAssistant = existingAssistants.data.find(assistant => assistant.name === 'CODING_REACT');
  if (!existingAssistant) {
    throw new Error('Coding_REACT assistant does not exist. Please create it first.');
  }
  return existingAssistant;
};
const myAssistant = async (threadId, prompt) => {
  try {
    const openai = getUserOpenaiClient(process.env.OPENAI_API_PROJECT_KEY);
    // -- 1
    const file = await openai.files.create({
      file: fs.createReadStream(path.join(__dirname, '@/public/static/files/chatgpt-prompts-custom.json')),
      purpose: 'assistants',
    });
    fileIds.push(file.id);
    // logger.info(`File ID: ${JSON.stringify(file, null, 2)}`);
    // // -- 2
    // const existingAssistants = await openai.beta.assistants.list();
    // if (existingAssistants) {
    //   logger.info(`Existing assistants: ${JSON.stringify(existingAssistants.data, null, 2)}`);
    // }
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
      const newAssistant = await openai.beta.assistants.create(assistantConfig);
      assistant = newAssistant;
    }
    if (!threadId.length) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
    }
    // --- User message --- //
    const message = await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: prompt,
      // file_ids: fileIds,
    });
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistant.id,
      instructions: 'Please address the user as Jane Doe. The user has a premium account.',
    });
    logger.info(`Run created: ${JSON.stringify(run, null, 2)}`);
    const asstRun = await openai.beta.threads.runs.retrieve(threadId, run.id);
    logger.info(`Assistant run: ${JSON.stringify(asstRun, null, 2)}`);
    const messages = await openai.beta.threads.messages.list(threadId);
    logger.info(`Messages: ${JSON.stringify(messages, null, 2)}`);
    return messages.data;
  } catch (err) {
    console.error('Error in chat bot =====>', err);
    return err;
  }
};

module.exports = { myAssistant };
router.post('/stream', asyncHandler(streamers.chatStream));
router.get('/stream/upload', asyncHandler(streamers.uploadToFileStream));
router.post(
  '/assistants/create',
  asyncHandler(async (req, res, next) => {
    try {
      logger.info(`REQUEST: ${JSON.stringify(req.body)}`);
      const body = req.body;
      const config = body.config;
      const threadId = body.threadId || '';
      if (prompt.length) {
        const response = await myAssistant(threadId, prompt);
        return res.status(200).json({
          success: true,
          message: response,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Prompt is required',
        });
      }
    } catch (err) {
      console.error('error in post handler ---->', err);
      // return res.status(500).json({
      //   success: false,
      //   message: err,
      // });
      next(err);
    }
  })
);
router.post(
  '/assistants/messages',
  asyncHandler(async (req, res, next) => {
    try {
      const { content } = await request.json();

      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: content,
      });

      const stream = openai.beta.threads.runs.stream(threadId, {
        assistant_id: assistantId,
      });

      return new Response(stream.toReadableStream());
    } catch (err) {
      console.error('error in post handler ---->', err);

      next(err);
    }
  })
);
router.post(
  '/assistants/stream',
  asyncHandler(async (req, res, next) => {
    try {
      logger.info(`REQUEST: ${JSON.stringify(req.body)}`);
      const { toolCallOutputs, runId } = await request.json();

      const stream = openai.beta.threads.runs.submitToolOutputsStream(
        threadId,
        runId,
        // { tool_outputs: [{ output: result, tool_call_id: toolCallId }] },
        { tool_outputs: toolCallOutputs }
      );

      return new Response(stream.toReadableStream());
    } catch (err) {
      console.error('error in post handler ---->', err);
      // return res.status(500).json({
      //   success: false,
      //   message: err,
      // });
      next(err);
    }
  })
);
// Open a new thread
router.get('/assistant/thread/create', (req, res) => {
  streamers.createThread().then(thread => {
    res.json({ threadId: thread.id });
  });
});

router.post(
  '/assistant/test',
  asyncHandler(async (req, res, next) => {
    try {
      logger.info(`REQUEST: ${JSON.stringify(req.body)}`);
      const body = req.body;
      const prompt = body.prompt;
      const threadId = body.threadId;
      if (prompt.length) {
        const response = await myAssistant(threadId, prompt);
        return res.status(200).json({
          success: true,
          message: response,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Prompt is required',
        });
      }
    } catch (err) {
      console.error('error in post handler ---->', err);
      // return res.status(500).json({
      //   success: false,
      //   message: err,
      // });
      next(err);
    }
  })
);

router.post('/assistant/message', (req, res) => {
  const { message, threadId } = req.body;
  streamers.addMessage(threadId, message).then(message => {
    // res.json({ messageId: message.id });

    // Run the assistant
    runAssistant(threadId).then(run => {
      const runId = run.id;

      // Check the status
      pollingInterval = setInterval(() => {
        checkingStatus(res, threadId, runId);
      }, 5000);
    });
  });
});
module.exports = router;

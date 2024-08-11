const { openAiApiAssistantService } = require('./assistant');
const { openAiApiFileService } = require('./files');
const { openAiApiMessageService } = require('./messages');
const { openAiApiRunService } = require('./runs');
const { openAiApiThreadService } = require('./thread');

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

const getAssistantByThreadId = async (threadId, prompt) => {
  try {
    const openai = getUserOpenaiClient(process.env.OPENAI_API_PROJECT_KEY);
    const { uploadFile } = openAiApiFileService(openai);
    const { createAssistant } = openAiApiAssistantService(openai);
    const { createThread } = openAiApiThreadService(openai);
    const { createMessage, listMessages } = openAiApiMessageService(openai);
    const { createRun, retrieveRun } = openAiApiRunService(openai);
    // -- 1
    const file = await uploadFile(path.join(__dirname, '@/public/static/files/chatgpt-prompts-custom.json'));
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
      instructions: 'Please address the user as Jane Doe. The user has a premium account.',
    });
    const asstRun = await retrieveRun(threadId, run.id);
    const messages = await listMessages(threadId);
    return messages.data;
  } catch (err) {
    console.error('Error in chat bot =====>', err);
    return err;
  }
};
const assistantController = {
  getByThread: getAssistantByThreadId,
};

module.exports = {
  assistantController,
};

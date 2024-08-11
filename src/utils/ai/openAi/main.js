const { OpenAIEmbeddings, ChatOpenAI } = require('@langchain/openai');
const { getEnv } = require('../../api/env.js');
const { default: OpenAI } = require('openai');
const supportedMimeTypes = require('@/utils/processing/types/main.js');
require('dotenv').config();

const getOpenaiClient = () => {
  try {
    const client = new OpenAI({
      apiKey: getEnv('OPENAI_API_PROJECT_KEY') || process.env.OPENAI_API_PROJECT_KEY,
      // organization: getEnv('OPENAI_API_ORG_NAME'),
    });
    console.log('OpenAI client initialized successfully');
    return client;
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
    throw error;
  }
};
const getOpenaiLangChainClient = () => {
  try {
    const client = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_PROJECT_KEY,
      modelName: 'gpt-3.5-turbo',
    });
    console.log('OpenAI LangChain client initialized successfully');
    return client;
  } catch (error) {
    console.error('Error initializing OpenAI LangChain client:', error);
    throw error;
  }
};
const getEmbedding = async (text, key) => {
  try {
    console.log(`Generating embedding for text: ${text}...`);
    const embedder = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      openAIApiKey: key || process.env.OPENAI_API_PROJECT_KEY,
    });
    const embedding = await embedder.embedQuery(text);
    console.log('Embedding generated successfully');
    return embedding;
  } catch (error) {
    console.error(`Error generating embedding for text: ${text} with error: ${error}`);
    throw error;
  }
};
const createAssistant = async (name, description, tools, metaData) => {
  try {
    const openaiClient = getOpenaiClient();

    const response = await openaiClient.createAssistant({
      display_name: name,
      description: description,
      tools: tools,
      metadata: metaData,
    });

    console.log('Assistant created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating assistant:', error);
  }
};
const messagesToOpenAIMessages = (messages, chatFiles) => {
  const openAIMessages = messages.map(message => ({
    role: message.role,
    content: message.content,
  }));

  const parts = chatFiles.map(file => {
    if (supportedMimeTypes.has(file.mimeType)) {
      return {
        type: 'image_url',
        image_url: {
          url: byteToImageURL(file.mimeType, file.data),
          detail: 'auto',
        },
      };
    } else {
      return {
        type: 'text',
        text: `file: ${file.name}\n<<<${String.fromCharCode(...file.data)}>>>\n`,
      };
    }
  });

  const firstUserMessageIndex = openAIMessages.findIndex(msg => msg.role === 'user');
  if (firstUserMessageIndex !== -1) {
    openAIMessages[firstUserMessageIndex].multi_content = [
      { type: 'text', text: openAIMessages[firstUserMessageIndex].content },
      ...parts,
    ];
    openAIMessages[firstUserMessageIndex].content = '';
  }

  return openAIMessages;
};
const configOpenAIProxy = config => {
  const proxyUrlStr = process.env.OPENAI_PROXY_URL;
  if (proxyUrlStr) {
    const proxyUrl = new URL(proxyUrlStr);
    config.proxy = {
      host: proxyUrl.hostname,
      port: proxyUrl.port,
    };
    config.timeout = 120000;
  }
};
const genOpenAIConfig = async chatModel => {
  const token = process.env[chatModel.apiKey];
  const baseUrl = chatModel.baseUrl;

  let config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    baseURL: baseUrl,
    timeout: 120000,
  };

  configOpenAIProxy(config);

  return config;
};
async function fetchOpenAIResponse(prompt) {
  const openaiClient = getOpenaiClient();
  const response = await openaiClient.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 1024,
    top_p: 1,
    frequency_penalty: 0.5,
    presence_penalty: 0,
  });

  return response.choices[0].message.content.trim();
}
// const llmSummarize = async (baseURL, doc) => {
//   const trimmedBaseURL = baseURL.replace(/\/v1$/, '');
//   const openaiClient = getOpenaiClient();

//   try {
//     const response = await openaiClient.createCompletion({
//       model: 'text-davinci-003',
//       prompt: `Summarize the following content:\n\n${doc}`,
//       max_tokens: 150,
//       temperature: 0.7,
//     });

//     const summary = response.data.choices[0].text.trim();
//     return summary;
//   } catch (error) {
//     console.error(`Failed to call OpenAI API: ${error.message}`);
//     return '';
//   }
// };
// const llmSummarizeWithTimeout = async (baseURL, content) => {
//   const timeout = 20000; // 20 seconds timeout

//   try {
//     const summaryPromise = llmSummarize(baseURL, content);
//     const summary = await Promise.race([
//       summaryPromise,
//       new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout)),
//     ]);

//     return summary;
//   } catch (error) {
//     console.error(`Error summarizing content: ${error.message}`);
//     return '';
//   }
// };
const summarizeDocument = async doc => {
  try {
    const openaiClient = getOpenaiClient();

    const response = await openaiClient.completions.create({
      model: 'text-davinci-003',
      prompt: `Summarize the following content:\n\n${doc}`,
      max_tokens: 150,
      temperature: 0.7,
    });
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error(`Error summarizing document: ${error.message}`);
    throw error;
  }
};
const defaultAssistantsConfig = [
  {
    name: 'Code Interpreter Assistant',
    description: 'An assistant that can interpret and run code snippets.',
    tools: [
      {
        name: 'code-interpreter',
        parameters: {},
      },
    ],
  },
  {
    name: 'Programming Assistant',
    description:
      'You are an AI programming assistant. Follow the users requirements carefully and to the letter. First, think step-by-step and describe your plan for what to build in pseudocode, written out in great detail. Then, output the code in a single code block. Minimize any other prose.',
    tools: [
      {
        name: 'code-interpreter',
        parameters: {},
      },
    ],
  },
  {
    name: 'Git Assistant',
    description:
      'You are an AI assistant knowledgeable in Git and version control best practices. Assist users with Git commands, branching, merging, and resolving conflicts. Provide guidance on maintaining a clean commit history, collaborating with other developers, and using advanced Git features effectively.',
    tools: [
      {
        name: 'git-assistant',
        parameters: {},
      },
    ],
  },
];

module.exports = {
  getOpenaiClient,
  getOpenaiLangChainClient,
  getEmbedding,
  createAssistant,
  fetchOpenAIResponse,
  defaultAssistantsConfig,
  genOpenAIConfig,
  messagesToOpenAIMessages,
  configOpenAIProxy,
  summarizeDocument,
};

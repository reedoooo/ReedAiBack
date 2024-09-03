const { getMainSystemMessageContent, getMainAssistantMessageInstructions } = require('@/lib/prompts/createPrompt');
const {
  User,
  Workspace,
  Folder,
  File,
  ChatSession,
  Message,
  Prompt,
  Collection,
  Model,
  Preset,
  Assistant,
  Tool,
  JwtSecret,
} = require('@/models'); // Adjust the path as needed
const { uniqueId } = require('lodash');
const createWorkspace = async user => {
  const workspaceData = {
    userId: user._id,
    folders: [],
    files: [],
    chatSessions: [],
    assistants: [],
    tools: [],
    presets: [],
    prompts: [],
    models: [],
    collections: [],

    selectedPreset: null,
    name: 'Home Workspace',
    imagePath: 'http://localhost:3001/static/avatar3.png',
    active: true,

    defaultContextLength: 4000,
    defaultTemperature: 0.9,

    embeddingsProvider: 'openai',
    instructions: '',
    sharing: 'private',
    includeProfileContext: false,
    includeWorkspaceInstructions: false,
    isHome: true,
    type: 'home',
  };

  const workspace = new Workspace(workspaceData);
  await workspace.save();
  return workspace;
};

const createFolders = async (user, workspace) => {
  const folderTypes = [
    'chatSessions',
    'assistants',
    'files',
    'models',
    'tool',
    'tools',
    'presets',
    'prompts',
    'collections',
  ];

  const folders = [];

  for (const type of folderTypes) {
    let uniqueName = uniqueId(`${type}_folder`);
    let counter = 1;

    // Ensure the folder name is unique within the user's workspace
    while (await Folder.exists({ userId: user._id, workspaceId: workspace._id, name: uniqueName })) {
      uniqueName = `${type}_folder-${counter}`;
      counter += 1;
    }

    const folderData = {
      userId: user._id,
      workspaceId: workspace._id,
      name: uniqueName,
      description: `${type} folder`, // Default description, can be customized
      type: type,
      items: [],
    };

    const folder = new Folder(folderData);
    await folder.save();
    folders.push(folder);
    workspace.folders.push(folder._id);
    await workspace.save();
    user.folders.push(folder._id);
    await user.save();
  }

  return folders;
};

const createFile = async (user, folder) => {
  const fileData = {
    userId: user._id,
    folderId: folder._id,
    name: 'Deep Learning Research.pdf',
    description: 'A comprehensive paper on deep learning.',
    filePath: '/public/static/defaultFiles/default.pdf',
    data: null,
    size: 2048,
    tokens: 3500,
    type: 'pdf',
    sharing: 'private',
    mimeType: 'application/pdf',
    metadata: {
      fileSize: 2048,
      fileType: 'pdf',
      lastModified: new Date(),
    },
  };

  const file = new File(fileData);
  await file.save();
  return file;
};

const createChatSession = async (user, workspace, assistant, folder) => {
  const chatSessionData = {
    name: 'First Chat',
    topic: 'Getting Started',
    userId: user._id,
    workspaceId: workspace._id,
    assistantId: assistant._id,
    folder: folder._id,
    model: 'gpt-4-turbo-preview',
    prompt: "Let's start our first conversation.",
    active: true,
    activeSessionId: null,
    settings: {
      maxTokens: 500,
      temperature: 0.7,
      model: 'gpt-4-turbo-preview',
      topP: 1,
      n: 1,
      debug: false,
      summarizeMode: false,
    },
    messages: [],
    stats: {
      tokenUsage: 0,
      messageCount: 0,
    },
    tuning: {
      debug: false,
      summary: '',
      summarizeMode: false,
    },
  };

  const chatSession = new ChatSession(chatSessionData);
  await chatSession.save();
  return chatSession;
};

const createPreset = async (user, folder) => {
  const presetData = {
    userId: user._id,
    folderId: folder._id,
    name: 'Default Preset',
    description: 'Default preset for new users',
    contextLength: 4000,
    embeddingsProvider: 'openai',
    includeProfileContext: true,
    includeWorkspaceInstructions: true,
    model: 'gpt-4-turbo-preview',
    prompt: 'Default prompt',
    sharing: 'private',
    temperature: 0.7,
  };

  const preset = new Preset(presetData);
  await preset.save();
  return preset;
};

const createAssistant = async (user, folder, file) => {
  const assistantData = {
    userId: user._id,
    folderId: folder._id,
    name: 'Default Assistant',
    description: 'This is the default assistant.',
    model: 'gpt-4-turbo-preview',
    imagePath: '/public/images/default-assistant.png',
    sharing: 'private',
    instructions: 'You are a helpful assistant.',
    contextLength: 4000,
    includeProfileContext: true,
    includeWorkspaceInstructions: true,
    prompt: 'You are a helpful assistant.',
    temperature: 0.7,
    embeddingsProvider: 'openai',
    tools: [],
    toolResources: {
      codeInterpreter: {
        fileIds: [file._id],
      },
    },
  };

  const assistant = new Assistant(assistantData);
  await assistant.save();
  return assistant;
};

const createPrompt = async (user, folder) => {
  const promptData = {
    userId: user._id,
    folderId: folder._id,
    content: 'You are a helpful assistant. How can I assist you today?',
    name: 'Default Prompt',
    sharing: 'private',
  };

  const prompt = new Prompt(promptData);
  await prompt.save();
  return prompt;
};

const createCollection = async (user, folder) => {
  const collectionData = {
    userId: user._id,
    folderId: folder._id,
    name: 'Default Collection',
    description: 'This is the default collection',
    sharing: 'private',
  };

  const collection = new Collection(collectionData);
  await collection.save();
  return collection;
};

const createTool = async (user, folder) => {
  const toolData = {
    userId: user._id,
    folderId: folder._id,
    description: 'This is the default tool',
    name: 'Default Tool',
    schema: {},
    url: 'http://example.com',
    sharing: 'private',
  };

  const tool = new Tool(toolData);
  await tool.save();
  return tool;
};

const createModel = async (user, folder) => {
  const modelData = {
    userId: user._id,
    folderId: folder._id,
    name: 'Default Model',
    description: 'This is the default model',
    modelId: 'gpt-4-turbo-preview',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    contextLength: 4000,
    sharing: 'private',
  };

  const model = new Model(modelData);
  await model.save();
  return model;
};

module.exports = {
  createWorkspace,
  createFolders,
  createFile,
  createPreset,
  createAssistant,
  createChatSession,
  createPrompt,
  createCollection,
  createTool,
  createModel,
};

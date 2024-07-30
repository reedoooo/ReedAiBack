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
} = require('../../models'); // Adjust the path as needed
const createWorkspace = async user => {
  const workspaceData = {
    userId: user._id,
    chatSessions: [],
    folders: [],
    name: 'Default Workspace',
    description: 'Default workspace for the user',
    imagePath: '',
    defaultContextLength: 4000,
    defaultModel: 'gpt-4-turbo-preview',
    defaultPrompt: '',
    defaultTemperature: 0.7,
    embeddingsProvider: 'openai',
    instructions: '',
    sharing: 'private',
    includeProfileContext: false,
    includeWorkspaceInstructions: false,
    isHome: true,
    type: 'workspace',
  };

  const workspace = new Workspace(workspaceData);
  await workspace.save();
  return workspace;
};

const createFolder = async (user, workspace, name, description, type) => {
  let uniqueName = name;
  let counter = 1;
  while (await Folder.exists({ userId: user._id, workspaceId: workspace._id, name: uniqueName })) {
    uniqueName = `${name}-${counter}`;
    counter += 1;
  }

  const folderData = {
    userId: user._id,
    workspaceId: workspace._id,
    files: [],
    collections: [],
    models: [],
    tools: [],
    presets: [],
    prompts: [],
    description,
    name: uniqueName,
    parent: null,
    subfolders: [],
    type,
  };

  const folder = new Folder(folderData);
  await folder.save();
  return folder;
};

const createFile = async (user, folder) => {
  const fileData = {
    userId: user._id,
    folderId: folder._id,
    name: 'Deep Learning Research.pdf',
    description: 'A comprehensive paper on deep learning.',
    filePath: '/public/files/default.pdf',
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

const createChatSession = async (user, workspace, assistant) => {
  const chatSessionData = {
    name: 'First Chat',
    topic: 'Getting Started',
    userId: user._id,
    workspaceId: workspace._id,
    assistantId: assistant._id,
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
  createFolder,
  createFile,
  createPreset,
  createAssistant,
  createChatSession,
  createPrompt,
  createCollection,
  createTool,
  createModel,
};

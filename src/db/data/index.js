// /**
//  * This file contains code for creating various entities and saving them in the database.
//  * It creates workspaces, folders, files, presets, assistants, chats, chat sessions, prompts, collections, tools, and models.
//  * The entities are associated with a user and a workspace.
//  * The code uses various models and dependencies from the '../../models' module.
//  * It also uses the bcryptjs, path, and uuid modules for generating unique identifiers and file paths.
//  * The created entities are then saved in the database.
//  */
// const bcrypt = require('bcryptjs');
// const path = require('path');
// const {
//   AssistantWorkspace,
//   Assistant,
//   CollectionWorkspace,
//   Collection,
//   FileWorkspace,
//   File,
//   Folder,
//   Message,
//   PresetWorkspace,
//   Preset,
//   PromptWorkspace,
//   Prompt,
//   ToolWorkspace,
//   Tool,
//   Workspace,
//   User,
//   ChatSession,
//   Model,
//   ModelWorkspace,
// } = require('../../models');
// const absolutePathToPublicPath = path.join(__dirname, '../public');
// const { v4: uuidv4 } = require('uuid');

// const createWorkspaces = async userId => {
//   const user = await User.findById(userId)
//     .populate('workspaces')
//     .populate('assistantWorkspaces')
//     .populate('promptWorkspaces')
//     .populate('fileWorkspaces')
//     .populate('collectionWorkspaces')
//     .populate('modelWorkspaces')
//     .populate('toolWorkspaces')
//     .populate('presetWorkspaces')
//     .populate('chatSessions')
//     .populate('assistantFiles')
//     .populate('messageFileItems')
//     .populate('chatFiles')
//     .populate('collectionFiles')
//     .populate('files')
//     .populate('folders')
//     .populate('presets')
//     .populate('collections');
//   const { username, email, password } = user;
//   const workspace = new Workspace({
//     userId: user._id,
//     chatSessions: [
//       ObjectId("62c8f1a2bc9e4e3b3e147c3e"),
//       ObjectId("62c8f2aabca34e4c5f159d30")
//     ],
//     folders: [
//       ObjectId("62c8f3abbd9d4e5c6e16ae1g"),
//       ObjectId("62c8f4acbe9e4e6d7f17bf2h")
//     ],
//     name: 'Workspace 1',
//     description: 'This is for testing.',
//     defaultContextLength: 4000,
//     defaultModel: 'gpt-4-turbo-preview',
//     defaultPrompt: 'You are an assistant.',
//     defaultTemperature: 0.5,
//     includeProfileContext: true,
//     includeWorkspaceInstructions: true,
//     instructions: 'These are the instructions.',
//     isHome: false,
//     sharing: 'private',
//     embeddingsProvider: 'openai',
//     messages: [],
//   });

//   // const homeWorkspace = new Workspace({
//   //   userId: user._id,
//   //   name: 'Home',
//   //   description: 'This is the home workspace.',
//   //   defaultContextLength: 4000,
//   //   defaultModel: 'gpt-4-turbo-preview',
//   //   defaultPrompt: 'You are an assistant.',
//   //   defaultTemperature: 0.5,
//   //   includeProfileContext: true,
//   //   includeWorkspaceInstructions: true,
//   //   instructions: 'These are the instructions.',
//   //   isHome: true,
//   //   sharing: 'private',
//   //   embeddingsProvider: 'openai',
//   //   messages: [],
//   // })

//   const createFolder = async (name, description, type) => {
//     let uniqueName = name;
//     let counter = 1;
//     while (await Folder.exists({ userId: user._id, workspaceId: workspace._id, name: uniqueName })) {
//       uniqueName = `${name}-${counter}`;
//       counter += 1;
//     }
//     return new Folder({
//       userId: user._id,
//       workspaceId: workspace._id,
//       files: [],
//       collections: [],
//       models: [],
//       tools: [],
//       presets: [],
//       prompts: [],
//       description: "Folder for AI research papers",
//       name: "AI Papers",
//       parent: null, // Assuming this is a top-level folder
//       subfolders: [],
//       name: uniqueName,
//       description,
//       type,
//     });
//   };

//   const fileFolder = await createFolder('Files', 'This is a folder for files', 'file');
//   const chatFolder = await createFolder('Chats', 'This is a folder for chats', 'chat');
//   const collectionFolder = await createFolder('Collections', 'This is a folder for collections', 'collection');
//   const presetFolder = await createFolder('Presets', 'This is a folder for presets', 'preset');
//   const promptFolder = await createFolder('Prompts', 'This is a folder for prompts', 'prompt');
//   const assistantFolder = await createFolder('Assistants', 'This is a folder for assistants', 'assistant');
//   const modelFolder = await createFolder('Models', 'This is a folder for models', 'model');
//   const toolFolder = await createFolder('Tools', 'This is a folder for tools', 'tool');

//   const file = new File({
//     userId: user._id,
//     folderId: fileFolder._id,
//     name: "Deep Learning Research.pdf",
//     description: "A comprehensive paper on deep learning.",
//     filePath: "/public/files/default.js",
//     data: null, // Assuming this field is handled differently in your application
//     size: 2048,
//     tokens: 3500,
//     type: "pdf",
//     sharing: "private",
//     mimeType: "application/pdf",
//     metadata: {
//       fileSize: 2048,
//       fileType: "pdf",
//       lastModified: new Date("2024-07-14T00:00:00Z")
//     }
//   });

//   const preset = new Preset({
//     userId: user._id,
//     sharing: 'private',
//     folderId: presetFolder._id,
//     includeProfileContext: true,
//     includeWorkspaceInstructions: true,
//     contextLength: 4000,
//     model: 'gpt-4-turbo-preview',
//     name: 'Preset 1',
//     prompt: 'Prompt 1',
//     temperature: 0.5,
//     description: 'Description for Preset 1',
//     embeddingsProvider: 'openai',
//   });

//   const assistant = new Assistant({
//     userId: user._id,
//     workspaceId: workspace._id,
//     folderId: assistantFolder._id,
//     name: 'Albert Einstein',
//     description: 'This is an Albert Einstein assistant.',
//     model: 'gpt-4-turbo-preview',
//     imagePath: `${absolutePathToPublicPath}/images`,
//     sharing: 'private',
//     instructions: 'These are the instructions for the assistant.',
//     contextLength: 4000,
//     includeProfileContext: true,
//     includeWorkspaceInstructions: true,
//     prompt: 'You are Albert Einstein.',
//     temperature: 0.5,
//     embeddingsProvider: 'openai',
//   });

//   const chatSession = new ChatSession({
//     name: "AI Research Discussion",
//     topic: "Exploring the Future of AI in Healthcare",
//     userId: ObjectId("62b8f0e8bc8b1e3a2e096b9a"),
//     workspaceId: ObjectId("62b8f1a2bc9e4e3b3e147c3d"),
//     assistantId: ObjectId("62b8f2aabca34e4c5f159d2f"),
//     model: "gpt-4-turbo-preview",
//     prompt: "Discuss the impact of AI on future healthcare technologies and patient care.",
//     active: true,
//     activeSessionId: ObjectId("62b8f3abbd9d4e5c6e16ae1g"),
//     settings: {
//       maxTokens: 500,
//       temperature: 0.7,
//       model: "gpt-4-turbo-preview",
//       topP: 1,
//       n: 4,
//       debug: false,
//       summarizeMode: false
//     },
//     messages: [
//       ObjectId("62b8f4acbe9e4e6d7f17bf2h"),
//       ObjectId("62b8f5adbfaf4e7e8e18cg3i")
//     ],
//     stats: {
//       tokenUsage: 1200,
//       messageCount: 2
//     },
//     tuning: {
//       debug: false,
//       summary: "A concise summary of AI's potential in healthcare.",
//       summarizeMode: false
//     }
//   });

//   const prompt = new Prompt({
//     userId: user._id,
//     folderId: promptFolder._id,
//     content:
//     "I want you to act as a storyteller. You will come up with entertaining stories that are engaging, imaginative and captivating for the audience. It can be fairy tales, educational stories or any other type of stories which has the potential to capture people's attention and imagination. Depending on the target audience, you may choose specific themes or topics for your storytelling session e.g., if it’s children then you can talk about animals; If it’s adults then history-based tales might engage them better etc. My first request is ''I need an interesting story on perseverance.''",
//     name: 'Storyteller',
//   });

//   const collection = new Collection({
//     userId: user._id,
//     folderId: collectionFolder._id,
//     name: 'Collection 1',
//     description: 'This is a description for Collection 1',
//     sharing: 'private',
//   });

//   const tool = new Tool({
//     userId: user._id,
//     folderId: toolFolder._id,
//     description: 'This is a description for Tool 1',
//     name: 'Tool 1',
//     schema: {},
//     url: 'http://example.com',
//     sharing: 'private',
//   });

//   const model = new Model({
//     userId: user._id,
//     folderId: modelFolder._id,
//     name: 'Model 1',
//     description: 'This is a description for Model 1',
//     modelId: 'model-1-id',
//     baseUrl: 'http://example.com/api',
//     apiKey: 'api-key-1234',
//     contextLength: 4000,
//     sharing: 'private',
//   });

//   chatSession.activeSessionId = chatSession._id;
//   workspace.chatSessions.push(chatSession._id);

//   const messages = [
//     {
//       sessionId: ObjectId("62c8f2aabca34e4c5f159d30"),
//       assistantId: ObjectId("62c8f2aabca34e4c5f159d2f"),
//       userId: ObjectId("62c8f0e8bc8b1e3a2e096b9a"),
//       content: "What are the latest trends in AI?",
//       attachments: [],
//       imagePaths: [],
//       model: "gpt-4-turbo-preview",
//       role: "user",
//       sequenceNumber: 1,
//       metadata: {}
//     },
//     {
//       userId: user._id,
//       chatId: chat._id,
//       sessionId: chatSession._id,
//       role: 'assistant',
//       content:
//         'You are an AI programming assistant. Follow the users requirements carefully and to the letter. First, think step-by-step and describe your plan for what to build in pseudocode, written out in great detail. Then, output the code in a single code block. Minimize any other prose.',
//       model: 'gpt-4-turbo-preview',
//       sequenceNumber: 0,
//       embeddings: [],
//     },
//     {
//       userId: user._id,
//       chatId: chat._id,
//       sessionId: chatSession._id,
//       role: 'system',
//       content: 'You are a helpful assistant that can interpret and execute code snippets.',
//       model: 'gpt-4-turbo-preview',
//       sequenceNumber: 1,
//       embeddings: [],
//     },
//     {
//       userId: user._id,
//       chatId: chat._id,
//       sessionId: chatSession._id,
//       role: 'user',
//       content: `Please interpret, fix, complete, and/or style and then run the following code request:\n\n${'formattedPrompt'}`,
//       model: 'gpt-4-turbo-preview',
//       sequenceNumber: 2,
//       embeddings: [],
//     },
//   ];

//   const entitiesToSave = [
//     workspace,
//     fileFolder,
//     chatFolder,
//     collectionFolder,
//     presetFolder,
//     promptFolder,
//     assistantFolder,
//     modelFolder,
//     toolFolder,
//     file,
//     preset,
//     assistant,
//     chatSession,
//     ...messages.map(message => new Message(message)),
//     prompt,
//     collection,
//     tool,
//     model,
//   ];

//   const workspaceEntitiesToSave = [
//     new FileWorkspace({
//       userId: user._id,
//       fileId: file._id,
//       workspaceId: workspace._id,
//     }),
//     new PresetWorkspace({
//       userId: user._id,
//       presetId: preset._id,
//       workspaceId: workspace._id,
//     }),
//     new AssistantWorkspace({
//       userId: user._id,
//       assistantId: assistant._id,
//       workspaceId: workspace._id,
//     }),
//     new PromptWorkspace({
//       userId: user._id,
//       promptId: prompt._id,
//       workspaceId: workspace._id,
//     }),
//     new CollectionWorkspace({
//       userId: user._id,
//       collectionId: collection._id,
//       workspaceId: workspace._id,
//     }),
//     new ToolWorkspace({
//       userId: user._id,
//       toolId: tool._id,
//       workspaceId: workspace._id,
//     }),
//     new ModelWorkspace({
//       userId: user._id,
//       modelId: model._id,
//       workspaceId: workspace._id,
//     }),
//   ];

//   entitiesToSave.push(...workspaceEntitiesToSave);

//   await Promise.all(entitiesToSave.map(entity => entity.save()));

//   user.workspaces.push(workspace._id);
//   user.assistantWorkspaces.push(assistant._id);
//   user.promptWorkspaces.push(prompt._id);
//   user.fileWorkspaces.push(file._id);
//   user.collectionWorkspaces.push(collection._id);
//   user.modelWorkspaces.push(model._id);
//   user.toolWorkspaces.push(tool._id);
//   user.presetWorkspaces.push(preset._id);
//   user.chatSessions.push(chatSession._id);
//   user.assistantFiles.push(assistant._id);
//   user.messageFileItems.push(messages[0]._id);
//   user.chatFiles.push(chat._id);
//   user.collectionFiles.push(collection._id);
//   user.folders.push(fileFolder._id);
//   user.folders.push(chatFolder._id);
//   user.folders.push(collectionFolder._id);
//   user.folders.push(presetFolder._id);
//   user.folders.push(promptFolder._id);
//   user.folders.push(assistantFolder._id);
//   user.folders.push(modelFolder._id);
//   user.folders.push(toolFolder._id);

//   user.presets.push(preset._id);

//   user.collections.push(collection._id);
//   user.assistants.push(assistant._id);
//   user.prompts.push(prompt._id);
//   user.models.push(model._id);
//   user.tools.push(tool._id);
//   user.files.push(file._id);
//   // user.messages.push(...messages.map(message => message._id));
//   // user.messages.push(...messages.map(message => message._id));

//   user.chatFiles.push(chat._id);
//   user.assistantFiles.push(assistant._id);
//   // user.messageFileItems.push(messages[0]._id);
//   user.collectionFiles.push(collection._id);

//   await user.save();

//   return user;
// };

// module.exports = {
//   createWorkspaces,
// };

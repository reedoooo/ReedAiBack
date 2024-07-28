// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
// const { faker } = require('@faker-js/faker');
// const path = require('path');
// const {
//   User,
//   Workspace,
//   Folder,
//   File,
//   ChatSession,
//   Message,
//   Prompt,
//   Collection,
//   Model,
//   Preset,
//   Assistant,
//   Tool,
//   JwtSecret,
// } = require('../models'); // Adjust the path as needed

// mongoose.connect(
//   'mongodb+srv://reedthahuman:Olivervogt1@clusterthahuman.drldbfy.mongodb.net/SharedDatabase?retryWrites=true&w=majority',
//   {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   }
// );

// const clearDatabase = async () => {
//   await User.deleteMany({});
//   await Workspace.deleteMany({});
//   await Folder.deleteMany({});
//   await File.deleteMany({});
//   await ChatSession.deleteMany({});
//   await Message.deleteMany({});
//   await Prompt.deleteMany({});
//   await Collection.deleteMany({});
//   await Model.deleteMany({});
//   await Preset.deleteMany({});
//   await Assistant.deleteMany({});
//   await Tool.deleteMany({});
//   await JwtSecret.deleteMany({});
// };

// const generateFakeData = async () => {
//   // Generate fake user data
//   const userData = {
//     username: faker.internet.userName(),
//     email: faker.internet.email(),
//     firstName: faker.person.firstName(),
//     lastName: faker.person.lastName(),
//     dateJoined: new Date(),
//     isActive: true,
//     auth: {
//       password: await bcrypt.hash('password123', 10),
//       management: {
//         rateLimit: faker.number.int({ min: 1, max: 100 }),
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       chatModelPrivileges: [],
//       lastLogin: new Date(),
//       isSuperuser: faker.datatype.boolean(),
//     },
//     authSession: {
//       token: faker.string.uuid(),
//       tokenType: 'Bearer',
//       accessToken: faker.string.uuid(),
//       refreshToken: faker.string.uuid(),
//       expiresIn: 3600,
//       expiresAt: Date.now() + 3600000,
//       createdAt: new Date(),
//     },
//     profile: {
//       img: path.join(__dirname, '../public/avatar1.png'),
//       imagePath: path.join(__dirname, '../public/avatar1.png'),
//       profileImages: [],
//       selectedProfileImage: path.join(__dirname, '../public/avatar1.png'),
//       bio: faker.lorem.sentence(),
//       displayName: faker.internet.userName(),
//       hasOnboarded: faker.datatype.boolean(),
//       identity: {
//         identityId: faker.string.uuid(),
//         userId: faker.string.uuid(),
//         identityData: {
//           email: faker.internet.email(),
//           emailVerified: faker.datatype.boolean(),
//           phoneVerified: faker.datatype.boolean(),
//           sub: faker.string.uuid(),
//         },
//         provider: faker.internet.domainName(),
//         lastSignInAt: faker.date.past(),
//       },
//       openai: {
//         apiKey: faker.string.uuid(),
//         organizationId: faker.string.uuid(),
//         apiVersion: 'v1',
//         projects: [],
//       },
//       // numbers
//       stats: {
//         totalMessages: 0,
//         totalTokenCount: 0,
//         totalMessages3Days: 0,
//         totalTokenCount3Days: 0,
//       },
//       location: {
//         city: faker.location.city(),
//         state: faker.location.state(),
//         country: faker.location.country(),
//       },
//       social: {
//         facebook: faker.internet.url(),
//         twitter: faker.internet.url(),
//         instagram: faker.internet.url(),
//         linkedin: faker.internet.url(),
//         github: faker.internet.url(),
//         website: faker.internet.url(),
//       },
//       dashboard: {
//         projects: new Map(),
//       },
//       settings: {
//         user: {
//           theme: 'light',
//           fontSize: 16,
//           language: 'en',
//           timezone: 'Seattle',
//         },
//         chat: {
//           presets: {
//             contextLength: 4000,
//             description: 'Description for Preset 1',
//             embeddingsProvider: 'openai',
//             folderId: null,
//             includeProfileContext: true,
//             includeWorkspaceInstructions: true,
//             model: 'gpt-4-turbo-preview',
//             name: 'Preset 1',
//             prompt: 'Prompt 1',
//             sharing: 'private',
//             temperature: 0.5,
//             userId: null,
//           },
//         },
//       },
//     },
//     openai: {
//       apiKey: faker.string.uuid(),
//       organizationId: faker.string.uuid(),
//       apiVersion: 'v1',
//       projects: [],
//     },
//     appMetadata: {
//       provider: faker.internet.domainName(),
//       providers: [faker.internet.domainName()],
//     },
//     workspaces: [],
//     assistants: [],
//     prompts: [],
//     chatSessions: [],
//     folders: [],
//     files: [],
//     collections: [],
//     models: [],
//     tools: [],
//     presets: [],
//   };

//   // Save user
//   const user = new User(userData);
//   await user.save();

//   // Generate and save other models data linked to the user
//   const workspaceData = {
//     userId: user._id,
//     name: faker.company.companyName(),
//     description: faker.lorem.sentence(),
//     imagePath: faker.image.imageUrl(),
//     defaultContextLength: faker.string.uuid(),
//     defaultModel: 'gpt-4',
//     defaultPrompt: faker.lorem.sentence(),
//     defaultTemperature: faker.datatype.float({ min: 0, max: 1 }),
//     embeddingsProvider: 'openai',
//     instructions: faker.lorem.paragraph(),
//     sharing: 'private',
//     includeProfileContext: true,
//     includeWorkspaceInstructions: true,
//     isHome: faker.datatype.boolean(),
//     type: 'workspace',
//   };
//   const workspace = new Workspace(workspaceData);
//   await workspace.save();

//   const folderData = {
//     workspaceId: workspace._id,
//     description: faker.lorem.sentence(),
//     name: faker.system.commonFileName(),
//     parent: null,
//     subfolders: [],
//     type: 'files',
//   };
//   const folder = new Folder(folderData);
//   await folder.save();

//   const fileData = {
//     folderId: folder._id,
//     name: faker.system.commonFileName(),
//     description: faker.lorem.sentence(),
//     filePath: faker.system.filePath(),
//     data: Buffer.from(faker.lorem.paragraph()),
//     size: faker.string.uuid(),
//     tokens: faker.string.uuid(),
//     type: 'txt',
//     sharing: 'private',
//     mimeType: 'text/plain',
//     metadata: {
//       fileSize: faker.string.uuid(),
//       fileType: 'text/plain',
//       lastModified: faker.date.recent(),
//     },
//   };
//   const file = new File(fileData);
//   await file.save();

//   const chatSessionData = {
//     name: faker.lorem.sentence(),
//     topic: faker.lorem.sentence(),
//     userId: user._id,
//     workspaceId: workspace._id,
//     assistantId: null,
//     model: 'gpt-4',
//     prompt: faker.lorem.sentence(),
//     active: true,
//     activeSessionId: null,
//     settings: new Map([
//       ['maxTokens', 500],
//       ['temperature', 0.7],
//       ['model', 'gpt-4-1106-preview'],
//       ['topP', 1],
//       ['n', 4],
//       ['debug', false],
//       ['summarizeMode', false],
//     ]),
//     messages: [],
//     stats: {
//       tokenUsage: faker.string.uuid(),
//       messageCount: faker.string.uuid(),
//     },
//     tuning: new Map([
//       ['debug', false],
//       ['summary', faker.lorem.sentence()],
//       ['summarizeMode', false],
//     ]),
//   };
//   const chatSession = new ChatSession(chatSessionData);
//   await chatSession.save();

//   const messageData = {
//     sessionId: chatSession._id,
//     type: 'user',
//     data: {
//       content: faker.lorem.sentence(),
//       additional_kwargs: {},
//     },
//     assistantId: null,
//     userId: user._id,
//     messageId: faker.string.uuid(),
//     conversationId: faker.string.uuid(),
//     content: faker.lorem.sentence(),
//     role: 'user',
//     tokens: faker.string.uuid(),
//     localEmbedding: faker.string.uuid(),
//     openaiEmbedding: faker.string.uuid(),
//     sharing: 'private',
//     sequenceNumber: faker.string.uuid(),
//     metadata: new Map([['key', 'value']]),
//   };
//   const message = new Message(messageData);
//   await message.save();

//   const promptData = {
//     folderId: folder._id,
//     userId: user._id,
//     content: faker.lorem.paragraph(),
//     name: faker.lorem.sentence(),
//     sharing: 'private',
//     key: faker.lorem.slug(),
//     value: faker.lorem.paragraph(),
//     metadata: new Map([
//       ['label', 'default prompt'],
//       ['text', 'A default prompt.'],
//       ['createdBy', 'default'],
//       ['description', ''],
//       ['type', ''],
//       ['style', ''],
//       ['props', ''],
//       ['tags', []],
//     ]),
//   };
//   const prompt = new Prompt(promptData);
//   await prompt.save();

//   const collectionData = {
//     folderId: folder._id,
//     userId: user._id,
//     name: faker.lorem.word(),
//     description: faker.lorem.sentence(),
//     sharing: 'private',
//   };
//   const collection = new Collection(collectionData);
//   await collection.save();

//   const modelData = {
//     folderId: folder._id,
//     userId: user._id,
//     apiKey: faker.string.uuid(),
//     baseUrl: faker.internet.url(),
//     modelId: faker.string.uuid(),
//     label: faker.lorem.word(),
//     contextLength: faker.string.uuid(),
//     maxToken: faker.string.uuid(),
//     defaultToken: faker.string.uuid(),
//     name: faker.lorem.word(),
//     description: faker.lorem.sentence(),
//     isDefault: faker.datatype.boolean(),
//   };
//   const model = new Model(modelData);
//   await model.save();

//   const presetData = {
//     userId: user._id,
//     folderId: folder._id,
//     name: faker.lorem.word(),
//     description: faker.lorem.sentence(),
//     contextLength: faker.string.uuid(),
//     embeddingsProvider: 'openai',
//     includeProfileContext: true,
//     includeWorkspaceInstructions: true,
//     model: 'gpt-4',
//     prompt: faker.lorem.sentence(),
//     sharing: 'private',
//     temperature: faker.datatype.float({ min: 0, max: 1 }),
//   };
//   const preset = new Preset(presetData);
//   await preset.save();

//   const assistantData = {
//     userId: user._id,
//     name: faker.person.firstName(),
//     instructions: faker.lorem.paragraph(),
//     contextLength: faker.string.uuid(),
//     model: 'gpt-4',
//     prompt: faker.lorem.sentence(),
//     description: faker.lorem.sentence(),
//     embeddingsProvider: 'openai',
//     folderId: folder._id,
//     imagePath: faker.image.imageUrl(),
//     includeProfileContext: true,
//     includeWorkspaceInstructions: true,
//     sharing: 'private',
//     temperature: faker.datatype.float({ min: 0, max: 1 }),
//     tools: [{ type: faker.lorem.word() }],
//     toolResources: {
//       codeInterpreter: {
//         fileIds: [file._id],
//       },
//     },
//   };
//   const assistant = new Assistant(assistantData);
//   await assistant.save();

//   const toolData = {
//     folderId: folder._id,
//     userId: user._id,
//     name: faker.lorem.word(),
//     description: faker.lorem.sentence(),
//     url: faker.internet.url(),
//     schema: {},
//     customHeaders: {},
//     sharing: 'private',
//   };
//   const tool = new Tool(toolData);
//   await tool.save();

//   const jwtSecretData = {
//     name: faker.lorem.word(),
//     secret: faker.string.uuid(),
//     audience: faker.internet.domainName(),
//     lifetime: 24,
//   };
//   const jwtSecret = new JwtSecret(jwtSecretData);
//   await jwtSecret.save();

//   console.log('Fake data generation complete.');
//   mongoose.connection.close();
// };

// const seedDatabase = async () => {
//   try {
//     await clearDatabase();
//     await generateFakeData();
//     console.log('Database seeding completed.');
//   } catch (error) {
//     console.error('Error seeding database:', error);
//     mongoose.connection.close();
//   }
// };

// seedDatabase();

// module.exports = {
//   seedDatabase,
//   generateFakeData,
//   clearDatabase,
// };

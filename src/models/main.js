const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const bcrypt = require('bcrypt');
const path = require('path');
const { createSchema, createModel } = require('./utils/schema');
const profileImagePath = path.join(__dirname, '../../public/files/avatar1.png');
const Json = Schema.Types.Mixed;
// =============================
// [USER]
// =============================
const jwtSecretSchema = new Schema({
  name: { type: String, required: false },
  secret: { type: String, required: false },
  audience: { type: String, required: false },
  lifetime: { type: Number, default: 24 },
});
const openAiSchema = new Schema(
  {
    apiKey: { type: String },
    organizationId: { type: String },
    apiVersion: { type: String },
    projects: { type: Array, default: [] },
  },
  { _id: false }
);
const identitySchema = new Schema(
  {
    identityId: { type: String },
    userId: { type: String },
    identityData: {
      email: { type: String },
      emailVerified: { type: Boolean, default: false },
      phoneVerified: { type: Boolean, default: false },
      sub: { type: String },
    },
    provider: { type: String },
    lastSignInAt: { type: Date },
  },
  { _id: false }
);
const profileSchema = new Schema(
  {
    img: { type: String, default: profileImagePath },
    imagePath: { type: String, default: profileImagePath },
    profileImages: { type: Array, default: [] },
    selectedProfileImage: { type: String, default: 'path/to/default/image' },
    filename: { type: String, default: 'avatar1.png' },
    bio: { type: String },
    displayName: { type: String },
    hasOnboarded: { type: Boolean, default: false },
    // messages: { type: Array, default: [] },
    identity: identitySchema,
    openai: openAiSchema,
    stats: {
      totalMessages: { type: Number, default: 0 },
      totalTokenCount: { type: Number, default: 0 },
      totalMessages3Days: { type: Number, default: 0 },
      totalTokenCount3Days: { type: Number, default: 0 },
    },
    location: {
      city: { type: String },
      state: { type: String },
      country: { type: String },
    },
    social: {
      facebook: { type: String },
      twitter: { type: String },
      instagram: { type: String },
      linkedin: { type: String },
      github: { type: String },
      website: { type: String },
    },
    dashboard: {
      projects: { type: Map, of: String },
    },
    settings: {
      user: {
        theme: { type: String, default: 'light' },
        fontSize: { type: Number, default: 16 },
        language: { type: String, default: 'en' },
        timezone: { type: String, default: 'Seattle' },
      },
      chat: {
        presets: {
          contextLength: { type: Number, required: false },
          description: { type: String, required: false },
          embeddingsProvider: { type: String, required: false },
          folderId: { type: String },
          includeProfileContext: { type: Boolean, required: false },
          includeWorkspaceInstructions: { type: Boolean, required: false },
          model: { type: String, required: false },
          name: { type: String, required: false },
          prompt: { type: String, required: false },
          sharing: { type: String },
          temperature: { type: Number, required: false },
          userId: { type: String, required: false },
        },
      },
    },
  },
  { _id: false }
);
const authUserManagementSchema = new Schema(
  {
    rateLimit: { type: Number, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);
const userChatModelPrivilegeSchema = new Schema(
  {
    chatModelId: { type: Schema.Types.ObjectId, ref: 'ChatModel', required: false },
    rateLimit: { type: Number, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: { type: Number, default: 0 },
    updatedBy: { type: Number, default: 0 },
  },
  { _id: false }
);
const authSchema = new Schema(
  {
    password: { type: String, required: false },
    management: authUserManagementSchema,
    chatModelPrivileges: [userChatModelPrivilegeSchema],
    lastLogin: { type: Date, default: Date.now },
    isSuperuser: { type: Boolean, default: false },
  },
  { _id: false }
);
const authSessionSchema = new Schema(
  {
    token: { type: String, default: '' },
    tokenType: { type: String, default: '' },
    accessToken: { type: String, default: '' },
    refreshToken: { type: String, default: '' },
    expiresIn: { type: Number, default: 3600 },
    expiresAt: { type: Number, default: () => Date.now() + 3600000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);
const appMetadataSchema = new Schema(
  {
    provider: { type: String },
    providers: [{ type: String }],
  },
  { _id: false }
);
const userSchema = new Schema(
  {
    // Basic Information
    username: { type: String, unique: true, trim: true, required: false, index: true },
    email: { type: String, unique: true, lowercase: true, trim: true, required: false, index: true },
    firstName: { type: String },
    lastName: { type: String },
    dateJoined: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },

    // Authentication Information
    auth: authSchema,
    authSession: authSessionSchema,

    // Profile Information
    profile: profileSchema,

    // OpenAI Integration
    openai: openAiSchema,

    // App Metadata
    appMetadata: appMetadataSchema,

    // Workspace Relationships
    workspaces: [{ type: Schema.Types.ObjectId, ref: 'Workspace', default: [] }],
    // Assistant and Prompts
    assistants: [{ type: Schema.Types.ObjectId, ref: 'Assistant', default: [] }],
    prompts: [{ type: Schema.Types.ObjectId, ref: 'Prompt', default: [] }],
    chatSessions: [{ type: Schema.Types.ObjectId, ref: 'ChatSession', default: [] }],

    // File and Collection Relationships
    folders: [{ type: Schema.Types.ObjectId, ref: 'Folder', default: [] }],
    files: [{ type: Schema.Types.ObjectId, ref: 'File', default: [] }],
    collections: [{ type: Schema.Types.ObjectId, ref: 'Collection', default: [] }],
    models: [{ type: Schema.Types.ObjectId, ref: 'Model', default: [] }],
    tools: [{ type: Schema.Types.ObjectId, ref: 'Tool', default: [] }],
    presets: [{ type: Schema.Types.ObjectId, ref: 'Preset', default: [] }],
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

// =============================
// [WORKSPACES]
//  - The workspace schema is used to store information workspaces in the chat.
//  - Workspaces are used to organize chats, files, and other resources.
//  - The primary data within each workspaces is:
//    - Active Chat Session: The active chat session within the workspace.
//    - Folders: An array of folders within the workspace.
// =============================
const workspaceSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  chatSessions: [{ type: Schema.Types.ObjectId, ref: 'ChatSession' }],
  folders: [{ type: Schema.Types.ObjectId, ref: 'Folder' }],

  name: { type: String, required: false },
  description: { type: String },
  imagePath: { type: String },
  active: { type: Boolean, default: false },

  defaultContextLength: { type: Number },
  defaultModel: { type: String },
  defaultPrompt: { type: String },
  defaultTemperature: { type: Number },

  embeddingsProvider: { type: String },
  instructions: { type: String },
  sharing: { type: String },
  includeProfileContext: { type: Boolean },
  includeWorkspaceInstructions: { type: Boolean },
  isHome: { type: Boolean, default: false },

  // CONSTANT SPACES
  type: {
    type: String,
    required: false,
    enum: ['profile', 'workspace', 'assistant', 'collection', 'model', 'tool', 'preset'],
  },
});
// =============================
// [FOLDERS]
// =============================
const folderSchema = createSchema({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  files: [{ type: Schema.Types.ObjectId, ref: 'File' }],
  collections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
  models: [{ type: Schema.Types.ObjectId, ref: 'Model' }],
  tools: [{ type: Schema.Types.ObjectId, ref: 'Tool' }],
  presets: [{ type: Schema.Types.ObjectId, ref: 'Preset' }],
  prompts: [{ type: Schema.Types.ObjectId, ref: 'Prompt' }],

  description: { type: String, required: false },
  name: { type: String, required: false, unique: true, index: true },
  parent: { type: Schema.Types.ObjectId, ref: 'Folder' },
  subfolders: [{ type: Schema.Types.ObjectId, ref: 'Folder' }],

  type: {
    type: String,
    required: false,
    enum: [
      'chats',
      'files',
      'models',
      'tool',
      'tools',
      'presets',
      'prompts',
      'collections',
      'assistants',
      'chat',
      'file',
      'model',
      'tool',
      'preset',
      'prompt',
      'collection',
      'chatSession',
      'assistant',
    ],
  },
});
// =============================
// [FILES]
// =============================
const fileSchema = createSchema({
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
  name: { type: String, required: false },
  description: { type: String, required: false },
  filePath: String,
  data: { type: Buffer, required: false },
  size: { type: Number, required: false },
  tokens: { type: Number, required: false },
  type: {
    type: String,
    required: false,
    enum: ['txt', 'pdf', 'doc', 'docx', 'md', 'html', 'json', 'csv'],
  },
  sharing: { type: String },
  mimeType: { type: String, required: false },
  metadata: {
    fileSize: Number,
    fileType: String,
    lastModified: Date,
  },
});
const fileWorkspaceSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  fileId: { type: Schema.Types.ObjectId, ref: 'File' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
});
const assistantFileSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  fileId: { type: Schema.Types.ObjectId, ref: 'File' },
  assistantId: { type: Schema.Types.ObjectId, ref: 'Assistant' },
});
const chatFileSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  fileId: { type: Schema.Types.ObjectId, ref: 'File' },
  sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession' },
});
const collectionFileSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  fileId: { type: Schema.Types.ObjectId, ref: 'File' },
  collectionId: { type: Schema.Types.ObjectId, ref: 'Collection' },
});
const messageFileItemSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  fileItemId: { type: Schema.Types.ObjectId, ref: 'FileItem' },
  messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
});
const fileItemSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  fileId: { type: Schema.Types.ObjectId, ref: 'File' },
  content: { type: String, required: false },
  tokens: { type: Number, required: false },
  localEmbedding: String,
  openaiEmbedding: String,
  sharing: String,
});
// =============================
// [MESSAGES]
// =============================
const messageSchema = createSchema({
  sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession' },
  type: String,
  data: {
    content: String,
    additional_kwargs: {},
  },
  assistantId: { type: Schema.Types.ObjectId, ref: 'Assistant' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  messageId: { type: String, required: false },
  conversationId: { type: String, required: false },
  content: { type: String, required: false },
  role: {
    type: String,
    required: false,
    enum: ['system', 'user', 'assistant', 'function', 'tool'],
  },
  tokens: { type: Number, required: false },
  localEmbedding: String,
  openaiEmbedding: String,
  sharing: String,
  sequenceNumber: Number,
  metadata: { type: Map, of: Schema.Types.Mixed, default: {} },
});

// =============================
// [CHATS]
// =============================
const userActiveChatSessionSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  chatSessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession' },
});
const chatSessionSchema = createSchema({
  name: { type: String, required: false },
  topic: { type: String, required: false },

  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  assistantId: { type: Schema.Types.ObjectId, ref: 'Assistant' },
  model: { type: String, required: false },
  prompt: { type: String, required: false },

  active: { type: Boolean, required: false },
  activeSessionId: { type: Schema.Types.ObjectId, ref: 'UserActiveChatSession' },

  settings: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {
      contextCount: 15,
      maxTokens: 500, // max length of the completion
      temperature: 0.7,
      model: 'gpt-4-1106-preview',
      topP: 1,
      n: 4,
      debug: false,
      summarizeMode: false,
    },
  },

  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: 'ChatMessage',
    },
  ],

  stats: {
    tokenUsage: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
  },

  tuning: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {
      debug: { type: Boolean, required: false },
      summary: { type: String, required: false },
      summarizeMode: { type: Boolean, required: false },
    },
  },
});
chatSessionSchema.index({ userId: 1, workspaceId: 1, name: 1 }, { unique: true });

chatSessionSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();

  if (this.isNew) {
    let uniqueName = this.name;
    let counter = 1;
    const originalName = this.name;

    while (true) {
      try {
        const existingSession = await this.constructor.findOne({
          userId: this.userId,
          workspaceId: this.workspaceId,
          name: uniqueName
        });

        if (!existingSession) {
          this.name = uniqueName;
          break;
        }

        uniqueName = `${originalName} (${counter})`;
        counter++;
      } catch (error) {
        return next(error);
      }
    }
  }

  next();
});
// =============================
// [PROMPTS]
// =============================
const promptSchema = createSchema({
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  content: String,
  name: String,
  sharing: String,
  key: String,
  value: String,
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {
      label: 'default prompt',
      text: 'A default prompt.',
      createdBy: 'default',
      description: '',
      type: '',
      style: '',
      props: {},
      tags: [],
    },
  },
});
promptSchema.pre('save', function (next) {
  this.key = this.name.toLowerCase().replace(/\s+/g, '_');
  this.value = this.content;
  next();
});
const promptWorkspaceSchema = createSchema({
  promptId: { type: Schema.Types.ObjectId, ref: 'Prompt' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
});
const collectionSchema = createSchema({
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  sharing: String,
});
const collectionWorkspaceSchema = createSchema({
  collectionId: { type: Schema.Types.ObjectId, ref: 'Collection' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
});
const modelSchema = createSchema({
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  apiKey: { type: String, required: false },
  baseUrl: { type: String, required: false },
  modelId: { type: String, required: false },
  label: { type: String },
  contextLength: { type: Number },
  maxToken: { type: Number },
  defaultToken: { type: Number },
  name: {
    type: String,
    required: false,
  },
  description: {
    type: String,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
});
const modelWorkspaceSchema = createSchema({
  modelId: { type: Schema.Types.ObjectId, ref: 'Model' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
});
const presetSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
  name: { type: String, required: false },
  description: { type: String, required: false },

  contextLength: { type: Number, required: false },
  embeddingsProvider: { type: String, required: false },
  includeProfileContext: { type: Boolean, required: false },
  includeWorkspaceInstructions: { type: Boolean, required: false },
  model: { type: String, required: false },
  prompt: { type: String, required: false },
  sharing: { type: String },
  temperature: { type: Number, required: false },
});
const presetWorkspaceSchema = createSchema({
  presetId: { type: Schema.Types.ObjectId, ref: 'Preset' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
});
const assistantSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: false },
  instructions: { type: String, required: false },
  contextLength: { type: Number },
  model: { type: String, required: false },
  prompt: { type: String, required: false },
  description: { type: String, required: false },
  embeddingsProvider: { type: String, required: false },
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
  imagePath: { type: String, required: false },
  includeProfileContext: { type: Boolean, required: false },
  includeWorkspaceInstructions: { type: Boolean, required: false },
  sharing: { type: String },
  temperature: { type: Number, required: false },
  tools: [{ type: { type: String, required: false } }],
  toolResources: {
    codeInterpreter: {
      fileIds: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    },
  },
});
// =============================
// [COLLECTIONS]
// =============================
const assistantCollectionSchema = createSchema({
  assistantId: { type: Schema.Types.ObjectId, ref: 'Assistant' },
  collectionId: { type: Schema.Types.ObjectId, ref: 'Collection' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
});
const assistantToolSchema = createSchema({
  assistantId: { type: Schema.Types.ObjectId, ref: 'Assistant' },
  toolId: { type: Schema.Types.ObjectId, ref: 'Tool' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
});
const assistantWorkspaceSchema = createSchema({
  assistantId: { type: Schema.Types.ObjectId, ref: 'Assistant' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
});
const toolSchema = createSchema({
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  url: String,
  schema: Schema.Types.Mixed,
  customHeaders: Schema.Types.Mixed,
  sharing: String,
});
const toolWorkspaceSchema = createSchema({
  toolId: { type: Schema.Types.ObjectId, ref: 'Tool' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
});
const objectSchema = createSchema({
  bucketId: { type: Schema.Types.ObjectId, ref: 'Bucket' },
  name: String,
  owner: String,
  ownerId: String,
  metadata: Schema.Types.Mixed,
  lastAccessedAt: Date,
  version: String,
  pathTokens: [String],
});
const bucketSchema = createSchema({
  name: String,
  public: Boolean,
  fileSizeLimit: Number,
  allowedMimeTypes: [String],
  avifAutodetection: Boolean,
  owner: String,
  ownerId: String,
});
// =============================
// [APP]
// =============================
const textBufferSchema = createSchema({
  builders: { type: Array, of: String, default: [] },
  prefix: { type: String, default: '' },
  suffix: { type: String, default: '' },
});
const schemas = {
  userSchema,
  workspaceSchema,
  folderSchema,
  fileSchema,
  fileWorkspaceSchema,
  assistantFileSchema,
  chatFileSchema,
  collectionFileSchema,
  messageFileItemSchema,
  fileItemSchema,
  messageSchema,
  promptSchema,
  promptWorkspaceSchema,
  collectionSchema,
  collectionWorkspaceSchema,
  modelSchema,
  modelWorkspaceSchema,
  presetSchema,
  presetWorkspaceSchema,
  assistantSchema,
  assistantCollectionSchema,
  assistantToolSchema,
  assistantWorkspaceSchema,
  toolSchema,
  toolWorkspaceSchema,
  objectSchema,
  bucketSchema,
  textBufferSchema,
};
const models = {
  // User
  User: createModel('User', userSchema),
  // Items
  Workspace: createModel('Workspace', workspaceSchema),
  UserActiveChatSession: createModel('UserActiveChatSession', userActiveChatSessionSchema),
  ChatSession: createModel('ChatSession', chatSessionSchema),
  Message: createModel('ChatMessage', messageSchema),
  Folder: createModel('Folder', folderSchema),
  File: createModel('File', fileSchema),
  Assistant: createModel('Assistant', assistantSchema),
  Collection: createModel('Collection', collectionSchema),
  Prompt: createModel('Prompt', promptSchema),
  Preset: createModel('Preset', presetSchema),
  Tool: createModel('Tool', toolSchema),
  Model: createModel('Model', modelSchema),

  FileWorkspace: createModel('FileWorkspace', fileWorkspaceSchema),
  PromptWorkspace: createModel('PromptWorkspace', promptWorkspaceSchema),
  CollectionWorkspace: createModel('CollectionWorkspace', collectionWorkspaceSchema),
  ModelWorkspace: createModel('ModelWorkspace', modelWorkspaceSchema),
  PresetWorkspace: createModel('PresetWorkspace', presetWorkspaceSchema),
  AssistantWorkspace: createModel('AssistantWorkspace', assistantWorkspaceSchema),
  ToolWorkspace: createModel('ToolWorkspace', toolWorkspaceSchema),

  AssistantFile: createModel('AssistantFile', assistantFileSchema),
  ChatFile: createModel('ChatFile', chatFileSchema),
  CollectionFile: createModel('CollectionFile', collectionFileSchema),
  MessageFileItem: createModel('MessageFileItem', messageFileItemSchema),
  FileItem: createModel('FileItem', fileItemSchema),
  AssistantCollection: createModel('AssistantCollection', assistantCollectionSchema),
  AssistantTool: createModel('AssistantTool', assistantToolSchema),
  // Chat: createModel('Chat', chatSchema),

  JwtSecret: createModel('JwtSecret', jwtSecretSchema),
  Object: createModel('Object', objectSchema),
  Bucket: createModel('Bucket', bucketSchema),
  TextBuffer: createModel('TextBuffer', textBufferSchema),
  // ChatMessage: createModel('ChatMessage', chatMessageSchema),
  // ChatLogs: createModel('ChatLogs', chatLogsSchema),
  // ChatFile: createModel('ChatFile', chatFileSchema),
};

module.exports = {
  ...schemas,
  ...models,
};

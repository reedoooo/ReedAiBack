const mongoose = require('mongoose');
const { Schema } = mongoose;
const path = require('path');
const { createSchema, createModel } = require('./utils/schema');
const profileImagePath = path.join(__dirname, '../../public/files/avatar1.png');
const passportLocalMongoose = require('passport-local-mongoose');

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
    selectedProfileImage: { type: String, default: profileImagePath },
    filename: { type: String, default: 'avatar1.png' },
    bio: { type: String },
    displayName: { type: String },
    username: { type: String },
    hasOnboarded: { type: Boolean, default: false },
    identity: identitySchema,
    openai: openAiSchema,
    envKeyMap: {
      type: Map,
      of: String,
      default: {
        openaiApiKey: '',
        openaiOrgId: '',
        anthropicApiKey: '',
        googleGeminiApiKey: '',
        mistralApiKey: '',
        groqAPIKey: '',
        perplexityApiKey: '',
      },
    },
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
    isActive: { type: Boolean, default: true },
    dateJoined: { type: Date, default: Date.now },
    hasOnboarded: { type: Boolean, default: false },

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
    chatSessions: [{ type: Schema.Types.ObjectId, ref: 'ChatSession', default: [] }],
    folders: [{ type: Schema.Types.ObjectId, ref: 'Folder', default: [] }],
    // Assistant and Prompts
    assistants: [{ type: Schema.Types.ObjectId, ref: 'Assistant', default: [] }],
    prompts: [{ type: Schema.Types.ObjectId, ref: 'Prompt', default: [] }],

    // File and Collection Relationships
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
userSchema.plugin(passportLocalMongoose);

// userSchema.index({ email: 1 }, { unique: true });
// userSchema.index({ username: 1 }, { unique: true });
// =============================
// [WORKSPACES]
//  - The workspace schema is used to store information workspaces in the chat.
//  - Workspaces are used to organize chatSessions, files, and other resources.
//  - The primary data within each workspaces is:
//    - Active Chat Session: The active chat session within the workspace.
//    - Folders: An array of folders within the workspace.
// =============================
const workspaceSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  folders: [{ type: Schema.Types.ObjectId, ref: 'Folder' }],
  files: [{ type: Schema.Types.ObjectId, ref: 'File' }],
  chatSessions: [{ type: Schema.Types.ObjectId, ref: 'ChatSession' }],
  assistants: [{ type: Schema.Types.ObjectId, ref: 'Assistant' }],
  tools: [{ type: Schema.Types.ObjectId, ref: 'Tool' }],
  presets: [{ type: Schema.Types.ObjectId, ref: 'Preset' }],
  prompts: [{ type: Schema.Types.ObjectId, ref: 'Prompt' }],
  models: [{ type: Schema.Types.ObjectId, ref: 'Model' }],
  collections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],

  selectedPreset: { type: Schema.Types.ObjectId, ref: 'Preset' },
  name: { type: String, required: false },
  imagePath: { type: String },
  active: { type: Boolean, default: false },

  defaultContextLength: { type: Number },
  defaultTemperature: { type: Number },

  embeddingsProvider: { type: String },
  instructions: { type: String },
  sharing: { type: String },
  includeProfileContext: { type: Boolean },
  includeWorkspaceInstructions: { type: Boolean },
  isHome: { type: Boolean, default: false },
  activeSessionId: String,

  type: {
    type: String,
    required: false,
    enum: ['profile', 'home', 'assistant', 'collection', 'model', 'tool', 'preset', 'prompt', 'file'],
  },
});
// =============================
// [FOLDERS] name, workspaceId
// =============================
const folderSchema = createSchema({
  // Critical
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  name: { type: String, required: false },
  description: { type: String, required: false },
  type: {
    type: String,
    required: false,
    enum: ['chatSessions', 'assistants', 'files', 'models', 'tool', 'tools', 'presets', 'prompts', 'collections'],
  },
  items: {
    type: Array,
    required: false,
    // default [],
  },
  // Extra
  parent: { type: Schema.Types.ObjectId, ref: 'Folder' },
  subfolders: [{ type: Schema.Types.ObjectId, ref: 'Folder' }],
});
// files: [{ type: Schema.Types.ObjectId, ref: 'File' }],
// collections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
// models: [{ type: Schema.Types.ObjectId, ref: 'Model' }],
// tools: [{ type: Schema.Types.ObjectId, ref: 'Tool' }],
// presets: [{ type: Schema.Types.ObjectId, ref: 'Preset' }],
// prompts: [{ type: Schema.Types.ObjectId, ref: 'Prompt' }],
// =============================
// [PROMPTS] createdBy, name, role, content, description, tags
// =============================
const promptSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
  name: String,
  role: String,
  type: String,
  content: String,
  description: String,
  sharing: String,
  key: String,
  value: String,
  rating: Number,
  tags: Array,
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {
      name: 'default prompt',
      content: 'A default prompt.',
      createdBy: 'default',
      description: '',
      type: '',
      style: '',
      props: {},
      tags: [],
    },
  },
});
// promptSchema.pre('save', function (next) {
//   this.key = this.name.toLowerCase().replace(/\s+/g, '_');
//   this.value = this.content;
//   next();
// });
// =============================
// [MESSAGES] content, role, files, sessionId
// =============================
const messageSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession' },
  assistantId: { type: Schema.Types.ObjectId, ref: 'Assistant' },
  files: [{ type: Schema.Types.ObjectId, ref: 'File' }],

  content: { type: String, required: false },
  role: {
    type: String,
    required: false,
    enum: ['system', 'user', 'assistant', 'function', 'tool'],
  },
  type: String,
  data: {
    content: String,
    additional_kwargs: {},
  },
  summary: {
    type: mongoose.Schema.Types.Mixed, // Allows storing any data type, including objects
    required: false,
  },
  tokens: { type: Number, required: false },
  localEmbedding: String,
  openaiEmbedding: String,
  sharing: String,
  sequenceNumber: Number,
  metadata: { type: Map, of: Schema.Types.Mixed, default: {} },
});
// =============================
// [FILES]
// =============================
const fileSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession' },
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
  messageId: { type: Schema.Types.ObjectId, ref: 'ChatMessage' },

  name: { type: String, required: false },
  size: { type: Number, required: false },
  originalFileType: { type: String, required: false },
  filePath: String,
  data: { type: Buffer, required: false },
  type: {
    type: String,
    required: false,
    enum: ['txt', 'pdf', 'doc', 'docx', 'md', 'html', 'json', 'csv', 'tsv', 'jsx', 'js', 'png', 'jpg', 'jpeg', 'gif'],
  },
  tokens: { type: Number, required: false },
  sharing: { type: String },
  mimeType: { type: String, required: false },
  metadata: {
    fileSize: Number,
    fileType: String,
    lastModified: Date,
  },
});
const assistantFileSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  assistantId: { type: Schema.Types.ObjectId, ref: 'Assistant' },
  fileId: { type: Schema.Types.ObjectId, ref: 'File' },
});
const chatFileSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession' },
  fileId: { type: Schema.Types.ObjectId, ref: 'File' },
});
const collectionFileSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  fileId: { type: Schema.Types.ObjectId, ref: 'File' },
  collectionId: { type: Schema.Types.ObjectId, ref: 'Collection' },
});
const messageFileItemSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  messageId: { type: Schema.Types.ObjectId, ref: 'ChatMessage' },
  fileItemId: { type: Schema.Types.ObjectId, ref: 'FileItem' },
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
// [CHAT SESSIONS]
// =============================
const userActiveChatSessionSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  chatSessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession' },
});
const chatSessionSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
  // activeSessionId: { type: Schema.Types.ObjectId, ref: 'UserActiveChatSession' },
  assistantId: { type: Schema.Types.ObjectId, ref: 'Assistant' },

  systemPrompt: { type: Schema.Types.ObjectId, ref: 'Prompt' },
  tools: [{ type: Schema.Types.ObjectId, ref: 'Tool' }],
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: 'ChatMessage',
    },
  ],
  files: [{ type: Schema.Types.ObjectId, ref: 'File' }],

  name: { type: String, required: false, default: 'Default Chat Session' },
  topic: { type: String, required: false, default: 'No Topic' },
  model: { type: String, required: false, default: 'gpt-4-turbo-preview' },
  active: { type: Boolean, required: false, default: true },
  summary: {
    type: mongoose.Schema.Types.Mixed, // Allows storing any data type, including objects
    required: false,
  },
  stats: {
    tokenUsage: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
  },
  apiKey: { type: String, required: false },
  settings: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {
      contextCount: 15,
      maxTokens: 2000, // max length of the completion
      temperature: 0.7,
      model: 'gpt-4-1106-preview',
      topP: 1,
      n: 4,
      debug: false,
      summarizeMode: false,
    },
  },
  langChainSettings: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {
      maxTokens: 2000, // max length of the completion
      temperature: 0.7,
      modelName: '',
      // streamUsage: true,
      streaming: true,
      openAIApiKey: '',
      organization: 'reed_tha_human',
      tools: [
        {
          type: 'function',
          function: {
            name: 'summarize_messages',
            description:
              'Summarize a list of chat messages with an overall summary and individual message summaries including their IDs',
            parameters: {
              type: 'object',
              properties: {
                overallSummary: {
                  type: 'string',
                  description: 'An overall summary of the chat messages',
                },
                individualSummaries: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        description: 'The ID of the chat message',
                      },
                      summary: {
                        type: 'string',
                        description: 'A summary of the individual chat message',
                      },
                    },
                    required: ['id', 'summary'],
                  },
                },
              },
              required: ['overallSummary', 'individualSummaries'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'fetchSearchResults',
            description:
              'Fetch search results for a given query using SERP API used to aid in being  PRIVATE INVESTIGATOR',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Query string to search for',
                },
              },
              required: ['query'],
            },
          },
        },
      ],
      code_interpreter: 'auto',
      function_call: 'auto',
    },
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
  activeSessionId: { type: String, required: false },
});
// chatSessionSchema.index({ userId: 1, workspaceId: 1, name: 1 }, { unique: true });
chatSessionSchema.pre('save', async function (next) {
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
          name: uniqueName,
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
// [TOOLS]
// =============================
const toolSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession' },
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
  assistantId: { type: Schema.Types.ObjectId, ref: 'Assistant' },
  name: String,
  description: String,
  url: String,
  schema: Schema.Types.Mixed,
  customHeaders: Schema.Types.Mixed,
  sharing: String,
  defaultSchema: {
    type: Object,
    required: false,
    default: {
      type: 'function',
      function: {
        name: '',
        description: '',
        parameters: {
          type: 'object',
          properties: {
            /* -- input properties -- */
          },
          required: [
            /* -- input required properties -- */
          ],
        },
      },
    },
  },
});
const assistantToolSchema = createSchema({
  toolId: { type: Schema.Types.ObjectId, ref: 'Tool' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
});
// ------------------------- //
const workspaceFilesSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  fileId: { type: Schema.Types.ObjectId, ref: 'File' },
});
const workspacePromptSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  promptId: { type: Schema.Types.ObjectId, ref: 'Prompt' },
});
const workspaceCollectionSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  collectionId: { type: Schema.Types.ObjectId, ref: 'Collection' },
});
const workspaceModelSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  modelId: { type: Schema.Types.ObjectId, ref: 'Model' },
});
const workspacePresetsSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  presetId: { type: Schema.Types.ObjectId, ref: 'Preset' },
});
const workspaceAssistantSchema = createSchema({
  assistantId: { type: Schema.Types.ObjectId, ref: 'Assistant' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
});
const workspaceToolSchema = createSchema({
  toolId: { type: Schema.Types.ObjectId, ref: 'Tool' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
});
// =============================
// [MODELS]
// =============================
const modelSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
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
// =============================
// [PRESETS]
// =============================
const presetSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
  name: { type: String, required: false },
  temperature: { type: Number, required: false },
  maxTokens: { type: Number, required: false },
  topP: { type: Number, required: false },
  frequencyPenalty: { type: Number, required: false },
  presencePenalty: { type: Number, required: false },
  n: { type: Number, required: false },
  contextLength: { type: Number, required: false },
  embeddingsProvider: { type: String, required: false },
  systemPrompt: { type: String, required: false },
  assistantPrompt: { type: String, required: false },
  functions: {
    type: Array,
    required: false,
  },
  includeProfileContext: { type: Boolean, required: false },
  includeWorkspaceInstructions: { type: Boolean, required: false },
  model: { type: String, required: false },
  prompt: { type: String, required: false },
  sharing: { type: String },
});
// =============================
// [ASSISTANTS]
// =============================
const assistantSchema = createSchema({
  // --- APP DATA
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },

  prompt: { type: String, required: false },
  contextLength: { type: Number },
  embeddingsProvider: { type: String, required: false },
  imagePath: { type: String, required: false },
  includeProfileContext: { type: Boolean, required: false, default: false },
  includeWorkspaceInstructions: { type: Boolean, required: false, default: false },
  sharing: { type: String, required: false, default: 'private' },
  // --- API DATA ---
  model: { type: String, required: false },
  name: { type: String, required: false },
  description: { type: String, required: false },
  instructions: { type: String, required: false },
  tools: [{ type: Schema.Types.ObjectId, ref: 'Tool' }],
  toolResources: {
    codeInterpreter: {
      fileIds: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    },
  },
  temperature: { type: Number, required: false, default: 0.9 },
  top_p: {
    type: Number,
    required: false,
    default: 1.0,
  },
  responseFormat: {
    type: String,
    required: false,
    default: 'json',
  },
});
// =============================
// [COLLECTIONS]
// =============================
const collectionSchema = createSchema({
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  sharing: String,
});
const assistantCollectionSchema = createSchema({
  assistantId: { type: Schema.Types.ObjectId, ref: 'Assistant' },
  collectionId: { type: Schema.Types.ObjectId, ref: 'Collection' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
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
  assistantFileSchema,
  chatFileSchema,
  collectionFileSchema,
  messageFileItemSchema,
  fileItemSchema,
  messageSchema,
  promptSchema,
  collectionSchema,
  modelSchema,
  presetSchema,
  assistantSchema,
  assistantCollectionSchema,
  assistantToolSchema,
  toolSchema,
  textBufferSchema,
};
const models = {
  User: createModel('User', userSchema),
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

  FileWorkspace: createModel('FileWorkspace', workspaceFilesSchema),
  PromptWorkspace: createModel('PromptWorkspace', workspacePromptSchema),
  CollectionWorkspace: createModel('CollectionWorkspace', workspaceCollectionSchema),
  ModelWorkspace: createModel('ModelWorkspace', workspaceModelSchema),
  PresetWorkspace: createModel('PresetWorkspace', workspacePresetsSchema),
  AssistantWorkspace: createModel('AssistantWorkspace', workspaceAssistantSchema),
  ToolWorkspace: createModel('ToolWorkspace', workspaceToolSchema),

  AssistantFile: createModel('AssistantFile', assistantFileSchema),
  ChatFile: createModel('ChatFile', chatFileSchema),
  CollectionFile: createModel('CollectionFile', collectionFileSchema),
  MessageFileItem: createModel('MessageFileItem', messageFileItemSchema),
  FileItem: createModel('FileItem', fileItemSchema),
  AssistantCollection: createModel('AssistantCollection', assistantCollectionSchema),
  AssistantTool: createModel('AssistantTool', assistantToolSchema),
  JwtSecret: createModel('JwtSecret', jwtSecretSchema),
  TextBuffer: createModel('TextBuffer', textBufferSchema),
};
module.exports.models = models;
module.exports.schemas = schemas;
module.exports = {
  ...schemas,
  ...models,
};

// defaultPreset: {
//   type: Schema.Types.ObjectId,
//   ref: 'Preset',
//   default: {
//     name: 'Default Preset',
//     description: 'A default preset.',
//     contextLength: 15,
//     model: 'gpt-4-1106-preview',
//     prompt: 'A default prompt.',
//     temperature: 0.7,
//     embeddingsProvider: 'openai',
//     includeProfileContext: true,
//     includeWorkspaceInstructions: true,
//     sharing: 'private',
//   },
// },
// defaultTool: {
//   type: Schema.Types.ObjectId,
//   ref: 'Tool',
//   default: {
//     name: 'Default Tool',
//     description: 'A default tool.',
//     instructions: 'A default tool.',
//     sharing: 'private',
//   },
// },
// defaultModel: {
//   type: Schema.Types.ObjectId,
//   ref: 'Model',
//   default: {
//     name: 'Default Model',
//     description: 'A default model.',
//     contextLength: 15,
//     maxToken: 500,
//     defaultToken: 100,
//     isDefault: true,
//   },
// },
// defaultPrompt: {
//   type: Schema.Types.ObjectId,
//   ref: 'Prompt',
//   default: {
//     name: 'Default Prompt',
//     content: 'A default prompt.',
//     sharing: 'private',
//   },
// },
// defaultCollection: {
//   type: Schema.Types.ObjectId,
//   ref: 'Collection',
//   default: {
//     name: 'Default Collection',
//     description: 'A default collection.',
//     sharing: 'private',
//   },
// },
// defaultFile: {
//   type: Schema.Types.ObjectId,
//   ref: 'File',
//   default: {
//     name: 'Default File',
//     description: 'A default file.',
//     sharing: 'private',
//   },
// },
// defaultAssistant: {
//   type: Schema.Types.ObjectId,
//   ref: 'Assistant',
//   default: {
//     name: 'Default Assistant',
//     description: 'A default assistant.',
//     instructions: 'A default assistant.',
//     sharing: 'private',
//   },
// },

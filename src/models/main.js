const mongoose = require('mongoose');
const { Schema } = mongoose;
const path = require('path');
const { createSchema, createModel } = require('./utils/schema');
const profileImagePath = path.join(__dirname, '../../public/files/avatar1.png');
const passportLocalMongoose = require('passport-local-mongoose');
const { logger } = require('@/config/logging');

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

workspaceSchema.pre('save', async function (next) {
  logger.info('Workspaceschema pre-save');
  next();
});
// =============================
// [FOLDERS] name, workspaceId
// =============================
const folderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    files: [{ type: Schema.Types.ObjectId, ref: 'File' }],

    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      required: false,
      enum: [
        'workspaces',
        'chatSessions',
        'assistants',
        'files',
        'models',
        'tools',
        'presets',
        'prompts',
        'collections',
      ],
    },
    space: {
      type: String,
      required: false,
      enum: [
        'workspaces',
        'chatSessions',
        'assistants',
        'files',
        'models',
        'tools',
        'presets',
        'prompts',
        'collections',
      ],
    },
    items: { type: Array, default: [] },
    // items: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     refPath: 'itemType',
    //   },
    // ],
    // itemType: [
    //   {
    //     type: String,
    //     enum: ['File', 'Folder'],
    //   },
    // ],
    parent: { type: Schema.Types.ObjectId, ref: 'Folder', index: true },
    path: { type: String, index: true },
    level: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes
folderSchema.index({ userId: 1, workspaceId: 1, name: 1 }, { unique: true });
folderSchema.index({ path: 1, workspaceId: 1 });

// Pre-save middleware
folderSchema.pre('save', async function (next) {
  logger.info('Folderschema pre-save');
  if (this.isNew || this.isModified('parent')) {
    const parent = await this.constructor.findById(this.parent);
    this.path = parent ? `${parent.path}/${this._id}` : `/${this._id}`;
    this.level = parent ? parent.level + 1 : 0;
  }
  next();
});

// Virtual for subfolders
folderSchema.virtual('subfolders', {
  ref: 'Folder',
  localField: '_id',
  foreignField: 'parent',
});

// Method to get all descendants
folderSchema.methods.getAllDescendants = async function () {
  return this.model('Folder').find({ path: new RegExp(`^${this.path}/`) });
};
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
  content: String,
  description: String,
  role: String,
  type: String,
  sharing: String,
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
promptSchema.pre('save', async function (next) {
  logger.info('Prompt pre-save hook');

  next();
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
messageSchema.pre('save', async function (next) {
  logger.info('Message pre-save hook');
  this.updatedAt = Date.now();

  next();
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
  space: {
    type: String,
    required: false,
    enum: ['chatSessions', 'assistants', 'files', 'models', 'tools', 'presets', 'prompts', 'collections'],
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
fileSchema.pre('save', async function (next) {
  logger.info('File pre-save hook');
  this.updatedAt = Date.now();

  next();
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
const chatSessionSchema = createSchema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
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
  logger.info('ChatSession pre-save hook');
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
toolSchema.pre('save', async function (next) {
  logger.info('Tool pre-save hook');
  this.updatedAt = Date.now();

  next();
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
  // userSchema,
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
  // User: createModel('User', userSchema),
  Workspace: createModel('Workspace', workspaceSchema),
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
  // JwtSecret: createModel('JwtSecret', jwtSecretSchema),
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

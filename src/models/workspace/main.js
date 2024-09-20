const mongoose = require('mongoose');
const { Schema } = mongoose;
const path = require('path');
const { createSchema, createModel } = require('../utils/schema');
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
    enum: [
      'profile',
      'home',
      'assistant',
      'collection',
      'model',
      'tool',
      'preset',
      'prompt',
      'file',
    ],
  },
});

workspaceSchema.pre('save', async function (next) {
  logger.info('Workspaceschema pre-save');
  next();
});
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
// [FOLDERS] name, workspaceId
// =============================
const folderSchema = new Schema(
  {
    // -- RELATIONSHIPS
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    files: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    prompts: [{ type: Schema.Types.ObjectId, ref: 'Prompt' }],
    chatSessions: [{ type: Schema.Types.ObjectId, ref: 'ChatSession' }],
    assistants: [{ type: Schema.Types.ObjectId, ref: 'Assistant' }],
    tools: [{ type: Schema.Types.ObjectId, ref: 'Tool' }],
    models: [{ type: Schema.Types.ObjectId, ref: 'Model' }],
    presets: [{ type: Schema.Types.ObjectId, ref: 'Preset' }],
    collections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
    // -- REQUIRED FIELDS
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
    metadata: {
      fileSize: Number,
      fileType: String,
      lastModified: Date,
      createdAt: Date,
      updatedAt: Date,
      originalName: String,
    },

    // -- ADDITIONAL FIELDS
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
  this.metadata.originalName = this.name;

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
const Workspace = createModel('Workspace', workspaceSchema);
const Folder = createModel('Folder', folderSchema);

const FileWorkspace = createModel('FileWorkspace', workspaceFilesSchema);
const PromptWorkspace = createModel('PromptWorkspace', workspacePromptSchema);
const CollectionWorkspace = createModel('CollectionWorkspace', workspaceCollectionSchema);
const ModelWorkspace = createModel('ModelWorkspace', workspaceModelSchema);
const PresetWorkspace = createModel('PresetWorkspace', workspacePresetsSchema);
const AssistantWorkspace = createModel('AssistantWorkspace', workspaceAssistantSchema);
const ToolWorkspace = createModel('ToolWorkspace', workspaceToolSchema);

module.exports = {
  Workspace,
  Folder,
  FileWorkspace,
  PromptWorkspace,
  CollectionWorkspace,
  ModelWorkspace,
  PresetWorkspace,
  AssistantWorkspace,
  ToolWorkspace,
};

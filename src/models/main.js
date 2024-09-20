const { logger } = require('@/config/logging');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { createSchema, createModel } = require('./utils');

// =============================
// [PROMPTS] createdBy, name, role, content, description, tags
// =============================
const promptSchema = createSchema({
  // -- RELATIONSHIPS
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  // -- OPTIONAL RELATIONSHIPS
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },

  // -- REQUIRED FIELDS
  name: { type: String, required: true, index: true },
  content: { type: String, required: true },

  // -- ADDITIONAL FIELDS
  description: String,
  role: { type: String, enum: ['system', 'user', 'assistant'] },
  type: String,
  sharing: { type: String, enum: ['private', 'public', 'workspace'] },
  rating: { type: Number, min: 0, max: 5 },
  tags: [String],
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
promptSchema.index({ userId: 1, name: 1 }, { unique: true });

promptSchema.pre('save', async function (next) {
  logger.info('Prompt pre-save hook');

  next();
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

const Collection = createModel('Collection', collectionSchema);
const Prompt = createModel('Prompt', promptSchema);
const Preset = createModel('Preset', presetSchema);
const Model = createModel('Model', modelSchema);
const AssistantCollection = createModel('AssistantCollection', assistantCollectionSchema);
const TextBuffer = createModel('TextBuffer', textBufferSchema);

module.exports = {
  collectionSchema,
  promptSchema,
  presetSchema,
  modelSchema,
  assistantCollectionSchema,
  textBufferSchema,
  Collection,
  Prompt,
  Preset,
  Model,
  AssistantCollection,
  TextBuffer,
};

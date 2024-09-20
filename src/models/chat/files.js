const mongoose = require('mongoose');
const { Schema } = mongoose;
const path = require('path');
const { createSchema, createModel } = require('../utils/schema');
const { logger } = require('@/config/logging');

// =============================
// [MESSAGES] content, role, files, sessionId
// =============================
const messageSchema = createSchema({
  // -- RELATIONSHIPS
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession' },
  assistantId: { type: Schema.Types.ObjectId, ref: 'Assistant' },
  files: [{ type: Schema.Types.ObjectId, ref: 'File' }],

  // -- REQUIRED FIELDS
  content: { type: String, required: false, maxlength: 1000000 },
  imagePaths: [{ type: String }],
  model: { type: String },
  role: {
    type: String,
    required: false,
    enum: ['system', 'user', 'assistant', 'function', 'tool'],
  },
  sequenceNumber: Number,

  // -- ADDITIONAL FIELDS
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
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sessionId: String,
      assistantId: String,
      files: [],
      content: '',
    },
  },
});
messageSchema.index({ sessionId: 1, createdAt: 1 });
// Pre-save middleware
messageSchema.pre('save', async function (next) {
  logger.info('Chat Message pre-save hook');
  this.updatedAt = Date.now();

  next();
});
// =============================
// [FILES]
// =============================
const fileSchema = createSchema({
  // -- RELATIONSHIPS
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession' },
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
  messageId: { type: Schema.Types.ObjectId, ref: 'ChatMessage' },

  // -- REQUIRED FIELDS
  name: { type: String, required: false },
  description: { type: String, required: false },
  filePath: { type: String, required: false },
  size: { type: Number, required: false },
  tokens: { type: Number, required: false },
  type: {
    type: String,
    required: false,
    enum: ['txt', 'pdf', 'doc', 'docx', 'md', 'html', 'json', 'csv', 'tsv', 'jsx', 'js', 'png', 'jpg', 'jpeg', 'gif'],
  },

  // -- ADDITIONAL FIELDS
  originalFileType: { type: String, required: false },
  data: { type: Buffer, required: false },
  space: {
    type: String,
    required: false,
    enum: ['chatSessions', 'assistants', 'files', 'models', 'tools', 'presets', 'prompts', 'collections'],
  },
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
chatFileSchema.pre('updateOne', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
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
messageFileItemSchema.index({ message_id: 1 });
messageFileItemSchema.pre('updateOne', function (next) {
  this.set({ updated_at: Date.now() });
  next();
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

const File = createModel('File', fileSchema);
const ChatFile = createModel('ChatFile', chatFileSchema);
const CollectionFile = createModel('CollectionFile', collectionFileSchema);
const MessageFileItem = createModel('MessageFileItem', messageFileItemSchema);
const FileItem = createModel('FileItem', fileItemSchema);
const AssistantFile = createModel('AssistantFile', assistantFileSchema);

module.exports = {
  File,
  ChatFile,
  CollectionFile,
  MessageFileItem,
  FileItem,
	AssistantFile,
};

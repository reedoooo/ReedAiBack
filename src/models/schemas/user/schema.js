const mongoose = require('mongoose');
const { Schema } = mongoose;
const path = require('path');
const { createSchema, createModel } = require('./utils/schema');
const profileImagePath = path.join(__dirname, '../../public/files/avatar1.png');
const passportLocalMongoose = require('passport-local-mongoose');

// =============================
// [USER SCHEMAS] - User schema definitions for the user model.
//  - jwtSecretSchema: Schema for storing JWT secrets.
//  - openAiSchema: Schema for storing OpenAI API keys.
//  - identitySchema: Schema for storing user identity information.
//  - authUserManagementSchema: Schema for storing user management information.
//  - userChatModelPrivilegeSchema: Schema for storing user chat model privileges.
//  - authSchema: Schema for storing user authentication information.
//  - authSessionSchema: Schema for storing user authentication session information.
//  - appMetadataSchema: Schema for storing user app metadata.
//  - profileSchema: Schema for storing user profile information.
//  - userSchema: Schema for storing user information.
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

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

module.exports = {
	jwtSecretSchema,
  openAiSchema,
  identitySchema,
  authSchema,
  authSessionSchema,
  appMetadataSchema,
	profileSchema,
  userSchema,
};

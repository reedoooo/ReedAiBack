const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const CustomError = require('@/config/constants/errors/CustomError');
const { Schema } = mongoose;
const path = require('path');
const profileImagePath = path.join(__dirname, '../../../public/files/avatar1.png');
const passportLocalMongoose = require('passport-local-mongoose');
const { logger } = require('@/config/logging');

// Pull in Environment variables
const ACCESS_TOKEN = {
  secret: process.env.AUTH_ACCESS_TOKEN_SECRET,
  expiry: process.env.AUTH_ACCESS_TOKEN_EXPIRY,
};
const REFRESH_TOKEN = {
  secret: process.env.AUTH_REFRESH_TOKEN_SECRET,
  expiry: process.env.AUTH_REFRESH_TOKEN_EXPIRY,
};
const RESET_PASSWORD_TOKEN = {
  expiry: process.env.RESET_PASSWORD_TOKEN_EXPIRY_MINS,
};
// =============================
// [USER]
// =============================
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
    img: { type: String, default: 'reed_profile.png' },
    imagePath: { type: String, default: '/static/images/reed_profile.png' },
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
    resetpasswordtoken: String,
    resetpasswordtokenexpiry: Date,
		tokens: [
			{
				token: { required: false, type: String },
			},
		],
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

/*
2. SET SCHEMA OPTION
 */
// userSchema.set('toJSON', {
//   virtuals: true,
//   transform: function (doc, ret, options) {
//     const { firstName, lastName, email } = ret;

//     return { firstName, lastName, email }; // return fields we need
//   },
// });

/*
3. ATTACH MIDDLEWARE
 */
userSchema.pre('save', async function (next) {
  logger.info('User pre-save middleware');
  try {
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (error) {
    next(error);
  }
});

/*
4. ATTACH CUSTOM STATIC METHODS
 */
// userSchema.statics.findByCredentials = async (email, password) => {
//   const user = await UserModel.findOne({ email });
//   if (!user) throw new CustomError('Wrong credentials!', 400, 'Email or password is wrong!');
//   const passwdMatch = await bcrypt.compare(password, user.password);
//   if (!passwdMatch) throw new CustomError('Wrong credentials!!', 400, 'Email or password is wrong!');
//   return user;
// };

/*
5. ATTACH CUSTOM INSTANCE METHODS
 */
userSchema.methods.generateAccessToken = function () {
  const user = this;

  // Create signed access token
  const accessToken = jwt.sign(
    {
      _id: user._id.toString(),
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
    },
    ACCESS_TOKEN.secret,
    {
      expiresIn: ACCESS_TOKEN.expiry,
    }
  );

  return accessToken;
};

userSchema.methods.generateRefreshToken = async function () {
  const user = this;

  // Create signed refresh token
  const refreshToken = jwt.sign(
    {
      _id: user._id.toString(),
    },
    REFRESH_TOKEN.secret,
    {
      expiresIn: REFRESH_TOKEN.expiry,
    }
  );

  // Create a 'refresh token hash' from 'refresh token'
  const rTknHash = crypto.createHmac('sha256', REFRESH_TOKEN.secret).update(refreshToken).digest('hex');

  // Save 'refresh token hash' to database
  user.tokens.push({ token: rTknHash });
  await user.save();

  return refreshToken;
};

userSchema.methods.generateResetToken = async function () {
  const resetTokenValue = crypto.randomBytes(20).toString('base64url');
  const resetTokenSecret = crypto.randomBytes(10).toString('hex');
  const user = this;

  // Separator of `+` because generated base64url characters doesn't include this character
  const resetToken = `${resetTokenValue}+${resetTokenSecret}`;

  // Create a hash
  const resetTokenHash = crypto.createHmac('sha256', resetTokenSecret).update(resetTokenValue).digest('hex');

  user.resetpasswordtoken = resetTokenHash;
  user.resetpasswordtokenexpiry = Date.now() + (RESET_PASSWORD_TOKEN.expiry || 5) * 60 * 1000; // Sets expiration age

  await user.save();

  return resetToken;
};

/*
6. COMPILE MODEL FROM SCHEMA
 */
const User = mongoose.model('User', userSchema);

module.exports = { User };

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const logger = require('../../config/logging');
require('dotenv').config();
const { User, Folder } = require('../../models');
const passport = require('passport');
// const { revokeToken } = require('../../utils');
const {
  createWorkspace,
  createFolder,
  createFile,
  createPreset,
  createAssistant,
  createChatSession,
  createPrompt,
  createCollection,
  createTool,
  createModel,
} = require('../../db/init'); // Adjust the path as needed
const defaultUserData = {
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  dateJoined: new Date(),
  isActive: true,
  auth: {
    password: '',
    management: {
      rateLimit: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    chatModelPrivileges: [],
    lastLogin: new Date(),
    isSuperuser: false,
  },
  authSession: {
    token: '',
    tokenType: '',
    accessToken: '',
    refreshToken: '',
    expiresIn: 3600,
    expiresAt: Date.now() + 3600000,
    createdAt: new Date(),
  },
  profile: {
    img: 'path/to/default/image',
    imagePath: 'path/to/default/image',
    profileImages: [],
    selectedProfileImage: 'path/to/default/image',
    bio: '',
    displayName: '',
    hasOnboarded: false,
    identity: {
      identityId: '',
      userId: '',
      identityData: {
        email: '',
        emailVerified: false,
        phoneVerified: false,
        sub: '',
      },
      provider: '',
      lastSignInAt: null,
    },
    openai: {
      apiKey: '',
      organizationId: '',
      apiVersion: '',
      projects: [],
    },
    stats: {
      totalMessages: 0,
      totalTokenCount: 0,
      totalMessages3Days: 0,
      totalTokenCount3Days: 0,
    },
    location: {
      city: '',
      state: '',
      country: '',
    },
    social: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      github: '',
      website: '',
    },
    dashboard: {
      projects: new Map(),
    },
    settings: {
      user: {
        theme: 'light',
        fontSize: 16,
        language: 'en',
        timezone: 'Seattle',
      },
      chat: {
        presets: {
          contextLength: 0,
          description: '',
          embeddingsProvider: '',
          folderId: '',
          includeProfileContext: false,
          includeWorkspaceInstructions: false,
          model: '',
          name: '',
          prompt: '',
          sharing: '',
          temperature: 0,
          userId: '',
        },
      },
    },
  },
  openai: {
    apiKey: '',
    organizationId: '',
    apiVersion: '',
    projects: [],
  },
  appMetadata: {
    provider: '',
    providers: [],
  },
  workspaces: [],
  assistants: [],
  prompts: [],
  chatSessions: [],
  folders: [],
  files: [],
  collections: [],
  models: [],
  tools: [],
  presets: [],
};
const checkDuplicate = async (Model, query) => {
  const existingItem = await Model.findOne(query);
  return existingItem ? existingItem : null;
};
// Helper function to generate tokens
const generateTokens = user => {
  const payload = { userId: user._id };
  const expiresIn = 60 * 60 * 24; // 24 hours
  const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn });
  const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn });
  return { accessToken, refreshToken, expiresIn };
};
const registerUser = async (req, res) => {
  try {
    logger.info(`${JSON.stringify(req.body)}`, req.body);
    const { username, email, password } = req.body;

    // Validate input data
    if (!username || !email || !password) {
      throw new Error('All fields (username, email, password) are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      throw new Error('Username or email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = new User({
      ...defaultUserData,
      username,
      email,
      'auth.password': passwordHash,
    });
    await user.save();

    // Initialize user data
    // const workspace = (await checkDuplicate(Workspace, { userId: user._id })) || (await createWorkspace(user));
    // Initialize user data
    const workspace = await createWorkspace(user);
    const folder = new Folder({
      userId: user._id,
      workspaceId: workspace._id,
      name: 'Home Folder',
      // name: type.charAt(0).toUpperCase() + type.slice(1),
      type: 'workspace',
      description: `Default folder for ${workspace}`,
    });
    const file = await createFile(user, folder);
    const preset = await createPreset(user, folder);
    const assistant = await createAssistant(user, folder, file);
    const chatSession = await createChatSession(user, workspace, assistant);
    const prompt = await createPrompt(user, folder);
    const collection = await createCollection(user, folder);
    const tool = await createTool(user, folder);
    const model = await createModel(user, folder);

    // Update user with created data
    user.workspaces.push(workspace._id);
    user.folders.push(folder._id);
    user.files.push(file._id);
    user.presets.push(preset._id);
    user.assistants.push(assistant._id);
    user.chatSessions.push(chatSession._id);
    user.prompts.push(prompt._id);
    user.collections.push(collection._id);
    user.tools.push(tool._id);
    user.models.push(model._id);
    await user.save();

    user.workspaces = user.workspaces.includes(workspace._id) ? user.workspaces : [...user.workspaces, workspace._id];

    logger.info(`User registered: ${user.username}`);

    const { accessToken, refreshToken, expiresIn } = generateTokens(user);
    const populatedUser = await User.findById(user._id).populate([
      'workspaces',
      'assistants',
      'prompts',
      'chatSessions',
      'folders',
      'files',
      'collections',
      'models',
      'tools',
      'presets',
    ]);

    res.status(201).json({
      accessToken,
      refreshToken,
      expiresIn,
      userId: user._id,
      message: 'User registered successfully',
      user: populatedUser,
    });
  } catch (error) {
    logger.error(`Error registering user: ${error.message}`);
    logger.error(`Error Stack: ${error.stack}`);
    logger.error(`Error Name: ${error.name}`);

    if (error.code === 11000) {
      if (error.message.includes('chatsessions index: sessionId_1 dup key')) {
        throw new Error('Error creating chat session. Please try again.');
      } else if (error.message.includes('username') || error.message.includes('email')) {
        throw new Error('Username or email already exists');
      }
    } else if (error.message.includes('All fields (username, email, password) are required')) {
      throw new Error('All fields (username, email, password) are required');
    } else if (error.message.includes('Password must be at least 6 characters long')) {
      throw new Error('Password must be at least 6 characters long');
    } else {
      throw new Error('An error occurred while registering the user');
    }
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const query = usernameOrEmail.includes('@') ? { email: usernameOrEmail } : { username: usernameOrEmail };
    let user = await User.findOne(query);
    if (!user) {
      throw new Error('User not found');
    }
    logger.info(`User found: ${user.email}`);
    logger.info(`Input password ${password}`);
    logger.info(`User password ${user.auth.password}`);
    const passwordMatch = await bcrypt.compare(password, user.auth.password);
    if (!passwordMatch) {
      throw new Error('Invalid password');
    }

    const expiresIn = 60 * 60 * 2; // 2 hours
    const accessToken = jwt.sign({
      userId: user._id,
      username: user.username,
      email: user.email,
    }, process.env.JWT_SECRET, { expiresIn });
    const refreshToken = jwt.sign({
      userId: user._id,
    }, process.env.JWT_REFRESH_SECRET, { expiresIn });
    user.authSession = {
      token: accessToken,
      tokenType: 'Bearer',
      accessToken,
      refreshToken,
      expiresIn,
      expiresAt: Date.now() + expiresIn * 1000,
      createdAt: new Date(),
    }

    await user.save();
    logger.info(`User logged in: ${user.email}`);
    const populatedUser = await User.findById(user._id).populate([
      'workspaces',
      'assistants',
      'prompts',
      'chatSessions',
      'folders',
      'files',
      'collections',
      'models',
      'tools',
      'presets',
    ]);
    res
      .status(200)
      .json({ accessToken, refreshToken, expiresIn, userId: user._id, message: 'Logged in successfully', user: populatedUser });
  } catch (error) {
    logger.error(`Error logging in: ${error.message}`);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

const logoutUser = async (req, res) => {
  try {
    // Check if there's a token in the request
    if (!req.token) {
      return res.status(400).json({ message: 'No active session found' });
    }

    // Revoke the token
    // This assumes you have a function to blacklist or invalidate tokens
    // If you're using JWT, you might add the token to a blacklist in your database
    await revokeToken(req.token);

    // Clear any session data if you're using sessions
    if (req.session) {
      req.session.destroy();
    }

    // Clear the token cookie if you're using cookie-based authentication
    res.clearCookie('token');

    // Log the logout action
    logger.info(`User logged out: ${req.token.username}`);

    // Send successful response
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error(`Error logging out: ${error.message}`);
    res.status(500).json({ message: 'Error logging out', error: error.message });
  }
};

const validateToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).send('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).send('Invalid token');
    }
    res.send('Token is valid');
  } catch (error) {
    res.status(401).send(error.message);
  }
};

const uploadProfileImage = async (req, res) => {
  try {
    const { userId } = req.params;
    const imagePath = req.file.path;
    await uploadProfileImage(userId, imagePath);
    res.status(200).send({ imagePath });
  } catch (error) {
    res.status(500).send('Error uploading image: ' + error.message);
  }
};

const getProfileImage = async (req, res) => {
  try {
    const { userId } = req.params;
    const imagePath = await getProfileImage(userId);
    res.sendFile(imagePath);
  } catch (error) {
    res.status(500).send('Error retrieving image: ' + error.message);
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { userId, updatedData } = req.params;
    Object.assign(req.user.profile, updatedData);

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    res.status(500).send('Error updating user profile: ' + error.message);
  }
};

const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { accessToken, refreshToken, expiresIn } = generateTokens(user);
    res.status(200).json({ accessToken, refreshToken, expiresIn });
  } catch (error) {
    logger.error(`Error refreshing token: ${error.message}`);
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  validateToken,
  uploadProfileImage,
  getProfileImage,
  updateUserProfile,
  refreshToken,
};

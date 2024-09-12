const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
require('dotenv').config();
const { Folder, Prompt, Tool, File, User } = require('@/models');
const {
  createWorkspace,
  createFolders,
  createFile,
  createPreset,
  createAssistant,
  createChatSession,
  createPrompt,
  createCollection,
  createTool,
  createModel,
} = require('@/db/init'); // Adjust the path as needed
const { logger } = require('@/config/logging');
const AuthorizationError = require('@/config/constants/errors/AuthorizationError');
const { getBucket, updateRelatedDocuments, getGFS } = require('@/db');
const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
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
const createDefaultFile = async (user, folder, options = {}) => {
  const bucket = getGFS();
  const fileData = options.content || 'This is the default content for the file.';
  const fileName = options.fileName || `default_${Date.now()}${options.extension || '.txt'}`;

  return new Promise((resolve, reject) => {
    const writestream = bucket.openUploadStream(fileName, {
      contentType: options.mimeType || 'text/plain',
      metadata: {
        originalName: fileName,
        uploadDate: new Date(),
        workspaceId: folder.workspaceId.toString(),
        userId: user._id.toString(),
        folderId: folder._id.toString(),
        space: folder.type,
      },
    });

    writestream.write(fileData);
    writestream.end();

    writestream.on('finish', async function (gridFsFile) {
      if (!gridFsFile || !gridFsFile._id) {
        return reject(new Error('Failed to create GridFS file'));
      }

      try {
        const newFile = new File({
          userId: user._id,
          workspaceId: folder.workspaceId,
          folderId: folder._id,
          name: fileName,
          size: Buffer.byteLength(fileData),
          filePath: `/uploads/${gridFsFile._id}`,
          type: path.extname(fileName).slice(1),
          mimeType: options.mimeType || 'text/plain',
          space: folder.type,
          gridFsId: gridFsFile._id,
        });

        await newFile.save();
        await updateRelatedDocuments(newFile);

        logger.info(`Default file created: ${newFile._id}`);
        resolve({
          mongoDocument: newFile,
          gridFsFile: {
            _id: gridFsFile._id,
            filename: gridFsFile.filename,
          },
        });
      } catch (error) {
        logger.error(`Error saving default file document: ${error.message}`);
        reject(error);
      }
    });

    writestream.on('error', function (error) {
      logger.error(`Error in GridFS stream: ${error.message}`);
      reject(error);
    });
  });
};

// const createDefaultTxtFile = async (user, folder) => {
//   const fileData = 'This is the default content for the text file.';
//   const newFile = new File({
//     userId: user._id,
//     workspaceId: folder.workspaceId, // Assuming the folder has workspaceId
//     folderId: folder._id,
//     name: 'default.txt',
//     size: Buffer.byteLength(fileData),
//     filePath: `/default_files/${folder._id}/default.txt`, // Adjust the path based on your setup
//     data: Buffer.from(fileData),
//     type: 'txt',
//     mimeType: 'text/plain',
//     space: folder.type, // Using the folder type as the file space
//   });

//   await newFile.save();
//   return newFile;
// };

const checkDuplicate = async (Model, query) => {
  const existingItem = await Model.findOne(query);
  return existingItem ? existingItem : null;
};
// Token generation function
const generateTokens = user => {
  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.AUTH_ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' } // Access token expires in 1 hour
  );
  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.AUTH_REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' } // Refresh token expires in 7 days
  );
  return { accessToken, refreshToken };
};
// Top-level constants
const REFRESH_TOKEN = {
  secret: process.env.AUTH_REFRESH_TOKEN_SECRET,
  cookie: {
    name: 'refreshTkn',
    options: {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
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
    const newUser = new User({
      ...defaultUserData,
      username,
      email,
      'auth.password': passwordHash,
    });
    await newUser.save();
    const { accessToken, refreshToken } = generateTokens(newUser);

    // SET refresh Token cookie in response
    res.cookie(REFRESH_TOKEN.cookie.name, refreshToken, REFRESH_TOKEN.cookie.options);
    // Initialize user data
    const workspace = await createWorkspace(newUser);
    const folders = await createFolders(newUser, workspace);

    // Create default files in each folder
    for (const folder of folders) {
      try {
        const { mongoDocument: defaultFile, gridFsFile } = await createDefaultFile(newUser, folder, {
          fileName: `default_${folder.type}.txt`,
          content: `This is the default content for ${folder.type} folder.`,
          mimeType: 'text/plain',
        });

        if (!defaultFile || !gridFsFile) {
          throw new Error('Failed to create default file');
        }

        folder.items.push(defaultFile._id);
        folder.files.push(defaultFile._id);
        newUser.files.push(defaultFile._id);
      } catch (error) {
        logger.error(`Error creating default file for folder ${folder.type}: ${error.message}`);
        // Continue with the next folder instead of stopping the whole registration process
        continue;
      }
    }
    // for (const folder of folders) {
    //   const defaultFile = await createDefaultTxtFile(newUser, folder);
    //   folder.items.push(defaultFile._id); // Ensure the default file is added to the folder's items
    //   folder.files.push(defaultFile._id); // Ensure the default file is added to the user's files
    //   newUser.files.push(defaultFile._id); // Ensure the default file is added to the user's files
    // }
    // Create items and associate them with folders
    const file = await createFile(
      newUser,
      folders.find(folder => folder.type === 'files')
    );
    const preset = await createPreset(
      newUser,
      folders.find(folder => folder.type === 'presets')
    );
    const assistant = await createAssistant(
      newUser,
      folders.find(folder => folder.type === 'assistants'),
      file
    );
    const chatSession = await createChatSession(
      newUser,
      workspace,
      assistant,
      folders.find(folder => folder.type === 'chatSessions')
    );
    const prompt = await createPrompt(
      newUser,
      workspace,
      folders.find(folder => folder.type === 'prompts')
    );
    const collection = await createCollection(
      newUser,
      folders.find(folder => folder.type === 'collections')
    );
    const tool = await createTool(
      newUser,
      workspace,
      folders.find(folder => folder.type === 'tools')
    );
    const model = await createModel(
      newUser,
      folders.find(folder => folder.type === 'models')
    );

    folders.find(folder => folder.type === 'files').items.push(file._id);
    folders.find(folder => folder.type === 'presets').items.push(preset._id);
    folders.find(folder => folder.type === 'assistants').items.push(assistant._id);
    folders.find(folder => folder.type === 'chatSessions').items.push(chatSession._id);
    folders.find(folder => folder.type === 'prompts').items.push(prompt._id);
    folders.find(folder => folder.type === 'collections').items.push(collection._id);
    folders.find(folder => folder.type === 'tools').items.push(tool._id);
    folders.find(folder => folder.type === 'models').items.push(model._id);

    // Save folders
    await Promise.all(folders.map(folder => folder.save()));

    // Push item IDs to workspace
    workspace.files.push(file._id);
    workspace.presets.push(preset._id);
    workspace.assistants.push(assistant._id);
    workspace.chatSessions.push(chatSession._id);
    workspace.prompts.push(prompt._id);
    workspace.collections.push(collection._id);
    workspace.tools.push(tool._id);
    workspace.models.push(model._id);

    // Save workspace
    await workspace.save();

    // Push workspace ID to user
    newUser.workspaces = newUser.workspaces.includes(workspace._id)
      ? newUser.workspaces
      : [...newUser.workspaces, workspace._id];
    newUser.userId = newUser._id;
    newUser.authSession = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: new Date(),
    };
    // newUser.authSession = {
    //   token: aTkn,
    //   tokenType: 'Bearer',
    //   accessToken: aTkn,
    //   refreshToken: refreshToken,
    //   expiresIn: 60 * 60 * 24, // 24 hours
    //   expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    //   createdAt: new Date(),
    // };
    const openai = {
      apiKey: process.env.OPENAI_API_PROJECT_KEY,
      organizationId: process.env.OPENAI_API_ORG_ID,
      apiVersion: '',
      projects: [
        {
          name: process.env.OPENAI_API_PROJECT_NAME,
          id: process.env.OPENAI_API_PROJECT_ID,
          organizationId: process.env.OPENAI_API_ORG_ID,
          organizationName: process.env.OPENAI_API_ORG_NAME,
          apiKey: process.env.OPENAI_API_PROJECT_KEY,
          apiVersion: '',
          default: true,
          users: [
            {
              userId: newUser._id,
              role: 'admin',
              readWrite: true,
            },
          ],
        },
      ],
    };

    newUser.profile.openai = openai;
    newUser.openai = openai;

    await newUser.save();
    logger.info(`User registered: ${newUser.username}`);

    const populatedUser = await User.findById(newUser._id).populate([
      'workspaces',
      {
        path: 'workspaces',
        populate: {
          path: 'chatSessions',
          model: 'ChatSession', // Replace 'Message' with the actual name of your Message model
        },
        populate: {
          path: 'folders',
          model: 'Folder', // Replace 'Message' with the actual name of your Message model
        },
        populate: {
          path: 'files',
          model: 'File', // Replace 'Message' with the actual name of your Message model
        },
        populate: {
          path: 'assistants',
          model: 'Assistant', // Replace 'Message' with the actual name of your Message model
        },
        populate: {
          path: 'prompts',
          model: 'Prompt', // Replace 'Message' with the actual name of your Message model
        },
        populate: {
          path: 'tools',
          model: 'Tool', // Replace 'Message' with the actual name of your Message model
        },
      },
      'assistants',
      'prompts',
      {
        path: 'chatSessions',
        populate: {
          path: 'messages',
          model: 'ChatMessage', // Replace 'Message' with the actual name of your Message model
        },
      },
      {
        path: 'folders',
        populate: {
          path: 'files',
          model: 'File', // Replace 'Message' with the actual name of your Message model
        },
        populate: [
          {
            path: 'items',
            refPath: 'itemType',
          },
          {
            path: 'subfolders',
            model: 'Folder',
            populate: {
              path: 'items',
              refPath: 'itemType',
            },
          },
        ],
      },
      'files',
      'collections',
      'models',
      'tools',
      'presets',
    ]);
    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      userId: newUser._id,
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
    } else if (error.message.includes('Failed to create default file')) {
      res.status(500).json({ error: 'Failed to create default files. Please try again.' });
    } else if (error.message.includes('All fields (username, email, password) are required')) {
      throw new Error('All fields (username, email, password) are required');
    } else if (error.message.includes('Password must be at least 6 characters long')) {
      throw new Error('Password must be at least 6 characters long');
    } else {
      throw new Error('An error occurred while registering the user');
    }
    next(error);
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
    logger.info(`User found: ${user.email}, Input password ${password}, User password ${user.auth.password}`);
    const passwordMatch = await bcrypt.compare(password, user.auth.password);
    if (!passwordMatch) {
      throw new Error('Invalid password');
    }
    const { accessToken, refreshToken } = generateTokens(user);
    // Update user with new tokens
    user.authSession = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: new Date(),
    };

    await user.save();
    logger.info(`User logged in: ${user.email}`);
    const populatedUser = await User.findById(user._id).populate([
      'workspaces',
      {
        path: 'workspaces',
        populate: {
          path: 'chatSessions',
          model: 'ChatSession',
        },
        populate: {
          path: 'folders',
          model: 'Folder',
        },
        populate: {
          path: 'files',
          model: 'File',
        },
        populate: {
          path: 'assistants',
          model: 'Assistant',
        },
        populate: {
          path: 'prompts',
          model: 'Prompt',
        },
        populate: {
          path: 'tools',
          model: 'Tool',
        },
      },
      'assistants',
      'prompts',
      {
        path: 'chatSessions',
        populate: {
          path: 'messages',
          model: 'ChatMessage',
        },
      },
      {
        path: 'folders',
        populate: [
          {
            path: 'items',
            refPath: 'itemType',
          },
          {
            path: 'subfolders',
            model: 'Folder',
            populate: {
              path: 'items',
              refPath: 'itemType',
            },
          },
        ],
      },
      'files',
      'collections',
      'models',
      'tools',
      'presets',
    ]);
    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      expiresIn: 60 * 60 * 24, // 24 hours
      userId: user._id,
      message: 'Logged in successfully',
      user: populatedUser,
    });
  } catch (error) {
    logger.error(`Error logging in: ${error.message}`);
    next(error);
    // res.status(500).json({ message: 'Error logging in', error: error.message, stack: error.stack, status: error.name });
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
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AuthorizationError('Refresh Token is missing');
    }

    const decoded = jwt.verify(refreshToken, process.env.AUTH_REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.authSession.refreshToken !== refreshToken) {
      throw new AuthorizationError('Invalid refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Update user with new tokens
    user.authSession = {
      accessToken,
      refreshToken: newRefreshToken,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: new Date(),
    };
    await user.save();

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error(`Error refreshing token: ${error.message}`);
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};
const addApiKey = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    user.openai.apiKey = req.body.apiKey;
    user.profile.openai.apiKey = req.body.apiKey;
    await user.save();
    res.status(201).json({ user, message: 'API key added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding API key', error: error.message });
  }
};
const validateToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).send('No token provided');
    }

    const decoded = jwt.verify(token, process.env.AUTH_REFRESH_TOKEN_SECRET);
    if (!decoded) {
      return res.status(401).send('Invalid token');
    }
    res.send('Token is valid');
  } catch (error) {
    res.status(401).send({
      message: 'Error validating token',
      error: error.message,
      stack: error.stack,
      status: error.name,
    });
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

    const decoded = jwt.verify(token, process.env.AUTH_REFRESH_TOKEN_SECRET);
    logger._constructLogger(decoded.userId, 'info', 'User refreshed their access token');
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
  addApiKey,
  refreshAccessToken,
};

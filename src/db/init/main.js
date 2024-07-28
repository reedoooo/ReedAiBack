// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
// const path = require('path');
// const profileImagePath = path.join(__dirname, '../../../public/avatar1.png');
// const { User } = require('../../models'); // Assuming models are in models.js

// const initializeUser = async (userData) => {
//   try {
//     const newUser = new User({
//       ...userData,
//       profile: {
//         ...userData.profile,
//         img: profileImagePath,
//         imagePath: profileImagePath,
//       },
//     });

//     // Hash the password
//     newUser.auth.password = await bcrypt.hash(userData.auth.password, 10);

//     // Save the new user
//     await newUser.save();

//     console.log('User initialized successfully:', newUser);
//   } catch (error) {
//     console.error('Error initializing user:', error);
//   }
// };

// // Sample user data
// const userData = {
//   username: 'sampleUser',
//   email: 'sample@example.com',
//   firstName: 'Sample',
//   lastName: 'User',
//   dateJoined: new Date(),
//   isActive: true,
//   auth: {
//     password: 'password123',
//     management: {
//       rateLimit: 0,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     },
//     chatModelPrivileges: [],
//     lastLogin: new Date(),
//     isSuperuser: false,
//   },
//   authSession: {
//     token: '',
//     tokenType: '',
//     accessToken: '',
//     refreshToken: '',
//     expiresIn: 3600,
//     expiresAt: Date.now() + 3600000,
//     createdAt: new Date(),
//   },
//   profile: {
//     img: profileImagePath,
//     imagePath: profileImagePath,
//     profileImages: [],
//     selectedProfileImage: profileImagePath,
//     bio: '',
//     displayName: '',
//     hasOnboarded: false,
//     identity: {
//       identityId: '',
//       userId: '',
//       identityData: {
//         email: '',
//         emailVerified: false,
//         phoneVerified: false,
//         sub: '',
//       },
//       provider: '',
//       lastSignInAt: null,
//     },
//     openai: {
//       apiKey: '',
//       organizationId: '',
//       apiVersion: '',
//       projects: [],
//     },
//     stats: {
//       totalMessages: 0,
//       totalTokenCount: 0,
//       totalMessages3Days: 0,
//       totalTokenCount3Days: 0,
//     },
//     location: {
//       city: '',
//       state: '',
//       country: '',
//     },
//     social: {
//       facebook: '',
//       twitter: '',
//       instagram: '',
//       linkedin: '',
//       github: '',
//       website: '',
//     },
//     dashboard: {
//       projects: new Map(),
//     },
//     settings: {
//       user: {
//         theme: 'light',
//         fontSize: 16,
//         language: 'en',
//         timezone: 'Seattle',
//       },
//       chat: {
//         presets: {
//           contextLength: 0,
//           description: '',
//           embeddingsProvider: '',
//           folderId: '',
//           includeProfileContext: false,
//           includeWorkspaceInstructions: false,
//           model: '',
//           name: '',
//           prompt: '',
//           sharing: '',
//           temperature: 0,
//           userId: '',
//         },
//       },
//     },
//   },
//   openai: {
//     apiKey: '',
//     organizationId: '',
//     apiVersion: '',
//     projects: [],
//   },
//   appMetadata: {
//     provider: '',
//     providers: [],
//   },
//   workspaces: [],
//   assistants: [],
//   prompts: [],
//   chatSessions: [],
//   folders: [],
//   files: [],
//   collections: [],
//   models: [],
//   tools: [],
//   presets: [],
// };

// // initializeUser(userData);

// module.exports = { initializeUser };
// routes/index.js
const systemFilesRoutes = require('./files/systemFiles.jsx');
const {
  chatStreamRoutes,
  filesRoutes,
  chatPresetsRoutes,
  chatMessageRoutes,
  chatModelRoutes,
  chatFilesRoutes,
  workspaceRoutes,
  chatSessionRoutes,
  chatPromptRoutes,
  chatFolderRoutes,
  chatCollectionRoutes,
  chatAssistantRoutes,
  chatToolsRoutes,
} = require('./chat/index.js');
const { userBaseRoutes, userOpenAiRoutes } = require('./user/index.js');
// const swaggerJSDoc = require('swagger-jsdoc');
// const swaggerUi = require('swagger-ui-express');
const setupRoutes = app => {
  //   const options = {
  //     definition: {
  //       openapi: '3.0.0',
  //       info: {
  //         title: 'ReedAi API',
  //         version: '1.0.0',
  //         description:
  //           'A node.js API for ReedAi: AI chat and chatbot for generating unique styled components and practical coding utilities',
  //       },
  //       servers: [
  //         {
  //           url: 'http://localhost:3001',
  //         },
  //       ],
  //     },
  //     apis: ['./routes/**/*.js', './routes/**/*.jsx'], // Path to the API docs
  //   };

  //   const specs = swaggerJSDoc(options);
  //   app.use('/api/api-docs', swaggerUi.serve(swaggerUi.setup(specs)));
  app.use('/api/user', userBaseRoutes);
  app.use('/api/user', userOpenAiRoutes);
  app.use('/api/files', systemFilesRoutes);
  app.use('/api/chat/chatFiles', chatFilesRoutes);
  app.use('/api/chat/files', filesRoutes);
  app.use('/api/chat/v1', chatStreamRoutes); // <-- This is actually the current main chat route and also handles the streaming
  app.use('/api/chat/workspaces', workspaceRoutes);
  app.use('/api/chat/sessions', chatSessionRoutes);
  app.use('/api/chat/tools', chatToolsRoutes);
  app.use('/api/chat/presets', chatPresetsRoutes);
  app.use('/api/chat/messages', chatMessageRoutes);
  app.use('/api/chat/models', chatModelRoutes);
  app.use('/api/chat/prompts', chatPromptRoutes);
  app.use('/api/chat/folders', chatFolderRoutes);
  app.use('/api/chat/collections', chatCollectionRoutes);
  app.use('/api/chat/assistants', chatAssistantRoutes);
};

module.exports = setupRoutes;
// const chatRoutes = require('./chat');
// const fileRoutes = require('./files/index.jsx');
// const fs = require('fs');
// const path = require('path');
// const uploadPath = '../../public/static/uploads';
// const uploadFilePath = path.join(__dirname, uploadPath);
// app.get('/static/files/:filename', (req, res) => {
//   const { filename } = req.params;
//   const filePath = path.join(__dirname, '../../public/static/files', filename);

//   // Check if the file exists
//   fs.exists(filePath, exists => {
//     if (!exists) {
//       return res.status(404).send('File not found');
//     }

//     // Send the file
//     res.sendFile(filePath);
//   });
// });
// app.post('/api/chat/upload/single', upload.single('file'), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: 'No file uploaded.' });
//   }

//   try {
//     // const coercedFile = await coerceFileSave(req.file);
//     req.file.path = uploadFilePath;
//     req.file.mimetype = req.file.filetype;

//     return res.json({ file: req.file });
//   } catch (error) {
//     logger.error('Error coercing file save:', error.message);
//     return res.status(400).json({ error: 'Error processing uploaded file.' });
//   }
// });

// app.post('/api/chat/upload/array', handleArrayUpload, (req, res) => {
//   if (req.files) {
//     return res.json({
//       message: 'Files uploaded successfully!',
//       files: req.files,
//       fileNames: req.files.map(file => file.filename),
//     });
//   }
//   res.status(400).json({ error: 'Files not uploaded' });
// });
// app.post('/api/chat/upload/multi-type-upload', handleMultiTypeUpload, async (req, res) => {
//   try {
//     const { files } = req;

//     // Process the files as needed
//     console.log('Files:', files);

//     res.status(200).json({ files });
//   } catch (error) {
//     console.error('Error handling multi-type upload:', error.message);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// // --- Vector API ROUTES ---
// app.post('/api/chat/chat/upsert-docs', upsertDocs);
// app.post('/api/chat/chat/query-components', queryComponents);
// // --- Session API ROUTES ---
// app.post('/api/chat/chat/chatSessions/session', async (req, res) => {
//   try {
//     const { sessionId } = req.body; // Extract sessionId from the request body
//     console.log('sessionId', sessionId);
//     if (!sessionId) {
//       return res.status(400).json({ message: 'sessionId is required' });
//     }

//     const session = await ChatSession.findById(sessionId).populate('messages');

//     if (session) {
//       res.status(200).json(session);
//     } else {
//       res.status(404).json({ message: 'Session not found' });
//     }
//   } catch (error) {
//     console.error('Error fetching session:', error.message);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });
// app.post('/chat/chatSessions/session/messages/save', sessionControllers.saveMessagesToChat);
// app.post('/api/chat/chat/chatSessions/session/:id/messages', sessionControllers.getChatSessionMessagesBySessionId);
// app.get('/api/chat/chat/chatSessions/:sessionId/retrieveSessions', async (req, res) => {
//   try {
//     const chatSessions = await ChatSession.find({ workspaceId: req.params.workspaceId }).sort({ createdAt: -1 });
//     res.json({ chatSessions });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// --- Workspace API ROUTES ---
// app.post('/chat/workspaces', createWorkspace);
// app.post('/api/chat/chat/workspaces/workspace', getWorkspaceByWorkspaceId);
// app.get('/api/chat/chat/workspaces/user/:userId', getWorkspacesByUserId);
// app.get('/api/chat/chat/workspaces/image/:workspaceId', getWorkspaceImage);
// app.get('/api/chat/chat/workspaces/home/:userId', getHomeWorkspaceByUserId);
// app.put('/api/chat/chat/workspaces/:workspaceId', updateWorkspace);
// app.delete('/api/chat/chat/workspaces/:workspaceId', deleteWorkspace);
// app.post('/api/chat/chat/workspaces/create-home/:userId', createHomeWorkspace);
// app.post(
//   '/api/chat/chat/workspaces/upload/:workspaceId',
//   (req, res, next) => {
//     req.fileType = 'image';
//     handleUpload.file(req, res, next);
//   },
//   uploadWorkspaceImage
// );
// };

// module.exports = setupRoutes;

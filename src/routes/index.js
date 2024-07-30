// routes/index.js
const userRoutes = require('./user');
const chatRoutes = require('./chat');
const fileRoutes = require('./files/index.jsx');
const { ChatSession } = require('../models/main.js');
const logger = require('../config/logging');
const mainControllerFile = require('../controllers').chat;
const sessionControllers = mainControllerFile.sessions;
const {
  createHomeWorkspace,
  getWorkspaceImage,
  getHomeWorkspaceByUserId,
  getWorkspacesByUserId,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceByWorkspaceId,
  uploadWorkspaceImage,
} = mainControllerFile.workspaces;
const chatMiscRoutes = require('./chat/Misc');
const { upsertDocs } = require('../utils/ai/pinecone/customUpsert.js');
const { queryComponents } = require('../utils/ai/pinecone/query.js');
const { handleMultiTypeUpload, handleSingleUpload, handleArrayUpload } = require('../middlewares/uploads.js');

const setupRoutes = app => {
  app.use('/api/user', userRoutes);
  app.use('/api/chat/v1', handleMultiTypeUpload, chatMiscRoutes); // <-- This is actually the current main chat route and also handles the streaming

  app.use('/api/files', fileRoutes);
  app.get('/static/files/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../public/static/files', filename);

    // Check if the file exists
    fs.exists(filePath, exists => {
      if (!exists) {
        return res.status(404).send('File not found');
      }

      // Send the file
      res.sendFile(filePath);
    });
  });
  app.post('/api/upload/single', handleSingleUpload, (req, res) => {
    if (req.file) {
      return res.json({ file: req.file });
    }
    res.status(400).json({ error: 'File not uploaded' });
  });
  app.post('/api/upload/array', handleArrayUpload, (req, res) => {
    if (req.files) {
      return res.json({ files: req.files });
    }
    res.status(400).json({ error: 'Files not uploaded' });
  });
  app.post('/api/upload/multi-type-upload', handleMultiTypeUpload, async (req, res) => {
    try {
      const { files } = req;

      // Process the files as needed
      console.log('Files:', files);

      res.status(200).json({ files });
    } catch (error) {
      console.error('Error handling multi-type upload:', error.message);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // --- Vector API ROUTES ---
  app.post('/api/chat/upsert-docs', upsertDocs);
  app.post('/api/chat/query-components', queryComponents);
  // --- Session API ROUTES ---
  app.post('/api/chat/chatSessions/session', async (req, res) => {
    try {
      const { sessionId } = req.body; // Extract sessionId from the request body
      console.log('sessionId', sessionId);
      if (!sessionId) {
        return res.status(400).json({ message: 'sessionId is required' });
      }

      const session = await ChatSession.findById(sessionId).populate('messages');

      if (session) {
        res.status(200).json(session);
      } else {
        res.status(404).json({ message: 'Session not found' });
      }
    } catch (error) {
      console.error('Error fetching session:', error.message);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  app.post('/chat/chatSessions/session/messages/save', sessionControllers.saveMessagesToChat);
  // app.post('/api/chat/chatSessions/session/:id/messages', sessionControllers.getChatSessionMessagesBySessionId);
  // app.get('/api/chat/chatSessions/:sessionId/retrieveSessions', async (req, res) => {
  //   try {
  //     const chatSessions = await ChatSession.find({ workspaceId: req.params.workspaceId }).sort({ createdAt: -1 });
  //     res.json({ chatSessions });
  //   } catch (error) {
  //     res.status(500).json({ error: error.message });
  //   }
  // });

  // --- Workspace API ROUTES ---
  app.post('/chat/workspaces', createWorkspace);
  app.post('/api/chat/workspaces/workspace', getWorkspaceByWorkspaceId);
  app.get('/api/chat/workspaces/user/:userId', getWorkspacesByUserId);
  app.get('/api/chat/workspaces/image/:workspaceId', getWorkspaceImage);
  app.get('/api/chat/workspaces/home/:userId', getHomeWorkspaceByUserId);
  app.put('/api/chat/workspaces/:workspaceId', updateWorkspace);
  app.delete('/api/chat/workspaces/:workspaceId', deleteWorkspace);
  app.post('/api/chat/workspaces/create-home/:userId', createHomeWorkspace);
  // app.post(
  //   '/api/chat/workspaces/upload/:workspaceId',
  //   (req, res, next) => {
  //     req.fileType = 'image';
  //     handleUpload.file(req, res, next);
  //   },
  //   uploadWorkspaceImage
  // );
};

module.exports = setupRoutes;

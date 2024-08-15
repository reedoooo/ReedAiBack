// routes/index.js
const systemFilesRoutes = require('./files/systemFiles.jsx');
const {
  chatStreamRoutes,
  filesRoutes,
  chatPresetsRoutes,
  chatMessageRoutes,
  chatModelRoutes,
  workspaceRoutes,
  chatSessionRoutes,
  chatPromptRoutes,
  chatFolderRoutes,
  chatCollectionRoutes,
  chatToolsRoutes,
} = require('./chat/index.js');
const { userBaseRoutes } = require('./user/index.js');

const setupRoutes = app => {
  app.use('/api/user', userBaseRoutes);
  app.use('/api/chat/v1', chatStreamRoutes); // <-- This is actually the current main chat route and also handles the streaming
  app.use('/api/chat/workspaces', workspaceRoutes);
  app.use('/api/chat/folders', chatFolderRoutes);
  app.use('/api/chat/files', filesRoutes);
  app.use('/api/chat/sessions', chatSessionRoutes);
  app.use('/api/chat/messages', chatMessageRoutes);
  app.use('/api/files', systemFilesRoutes);
  app.use('/api/chat/tools', chatToolsRoutes);
  app.use('/api/chat/presets', chatPresetsRoutes);
  app.use('/api/chat/models', chatModelRoutes);
  app.use('/api/chat/prompts', chatPromptRoutes);
  app.use('/api/chat/collections', chatCollectionRoutes);
};

module.exports = setupRoutes;

// routes/index.js
const {
  // chatAssistantRoutes,
  chatRoutes,
  chatAttachmentRoutes,
} = require('./chat-sessions');
const {
  chatSettingsRoutes,
} = require('./chat-items');
const {
  userBaseRoutes,
} = require('./user');
const {
  chatFolderRoutes,
  workspaceRoutes,
} = require('./workspaces');

const setupRoutes = app => {
  app.use('/api/user', userBaseRoutes);
  app.use('/api/chat/v1', chatRoutes); // <-- This is actually the current main chat route and also handles the streaming
  app.use('/api/chat/workspaces', workspaceRoutes);
  app.use('/api/chat/folders', chatFolderRoutes);
  app.use('/api/chat/files', chatAttachmentRoutes);
  app.use('/api/chat/messages', chatAttachmentRoutes);
  app.use('/api/chat/sessions', chatRoutes);
  app.use('/api/chat/tools', chatSettingsRoutes);
  app.use('/api/chat/presets', chatSettingsRoutes);
  app.use('/api/chat/models', chatSettingsRoutes);
  app.use('/api/chat/prompts', chatSettingsRoutes);
  app.use('/api/chat/collections', chatSettingsRoutes);
  // app.use('/api/chat/assistants', chatAssistantRoutes);
};

module.exports = setupRoutes;

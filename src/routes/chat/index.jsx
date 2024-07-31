const chatAssistantRoutes = require('./assistants');
const chatFilesRoutes = require('./chatfiles');
const chatCollectionRoutes = require('./collections');
const filesRoutes = require('./files');
const chatFolderRoutes = require('./folders');
const chatMessageRoutes = require('./messages');
const chatModelRoutes = require('./models');
const chatPresetsRoutes = require('./presets');
const chatPromptRoutes = require('./prompts');
const chatSessionRoutes = require('./sessions');
const chatStreamRoutes = require('./stream');
const chatToolsRoutes = require('./tools');
const workspaceRoutes = require('./workspaces');

module.exports = {
  chatAssistantRoutes,
  chatFilesRoutes,
  chatCollectionRoutes,
  filesRoutes,
  chatFolderRoutes,
  chatMessageRoutes,
  chatModelRoutes,
  chatPresetsRoutes,
  chatPromptRoutes,
  chatSessionRoutes,
  chatStreamRoutes,
  chatToolsRoutes,
  workspaceRoutes,
};
// module.exports = {
//   chatAssistantRoutes,
//   chatFileRoutes,
//   chatCollectionRoutes,
//   fileRoutes,
//   chatFolderRoutes,
//   chatMessageRoutes,
//   chatModelRoutes,
//   chatPresetsRoutes,
//   chatPromptRoutes,
//   chatSessionRoutes,
//   chatStreamRoutes,
//   chatToolsRoutes,
//   vectorRoutes,
//   workspaceRoutes,
// };
// const app = express();

// app.use('/api/chat-tools', chatToolsRoutes);
// app.use('/api/chat-presets', chatPresetsRoutes);
// app.use('/api/chat-messages', chatMessageRoutes);
// app.use('/api/chat-models', chatModelRoutes);
// app.use('/api/chat-files', chatFileRoutes);
// app.use('/api/workspaces', workspaceRoutes);
// app.use('/api/sessions', sessionRoutes);
// app.use('/api/files', fileRoutes);
// app.use('/api/chat-prompts', chatPromptRoutes);
// app.use('/api/chat-folders', chatFolderRoutes);
// app.use('/api/chat-collections', chatCollectionRoutes);
// app.use('/api/chat-assistants', chatAssistantRoutes);
// app.use('/api/vectors', vectorRoutes);

const { workspaceService, workspaceController } = require('./workspaces');
const { snapshotService, snapshotController } = require('./snapshot');
const { promptService, promptController } = require('./prompts');
const { assistantService, assistantController } = require('./assistants');
const { messageService, messageController } = require('./messages');
const { folderService, folderController } = require('./folders');
const { fileService, fileController } = require('./files');
const { chatFileService, chatFileController } = require('./chatFiles');
const { sessionService, sessionController } = require('./sessions');
const { streamService, streamController } = require('./stream');
const { mainService, mainController } = require('./main');
const { originalService, originalController } = require('./original');
const { codeService, codeController } = require('./code');
// const getWorkspaces = workspaceController.getWorkspaceImage;
module.exports = {
  workspaceService,
  workspaceController,
  snapshotService,
  snapshotController,
  promptService,
  promptController,
  assistantService,
  assistantController,
  folderService,
  folderController,
  fileService,
  fileController,
  chatFileService,
  chatFileController,
  messageService,
  messageController,
  sessionService,
  sessionController,
  streamService,
  streamController,
  mainService,
  mainController,
  originalService,
  originalController,
  codeService,
  codeController,
};

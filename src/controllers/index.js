module.exports = {
  ...require('./chat'),
  ...require('./user'),
};
// const ChatControllers = require('./chat/index.js');
// const UserControllers = require('./user');
// const AssistantControllers = ChatControllers.assistants;
// const FileControllers = require('./file');
// const { userController, userService } = require('./user');

// const {
//   // workspaces
//   workspaceService,
//   workspaceController,
//   promptService,
//   promptController,
//   assistantService,
//   assistantController,
//   folderService,
//   folderController,
//   fileService,
//   fileController,
//   messageService,
//   messageController,
//   sessionService,
//   sessionController,
//   streamService,
//   streamController,
//   mainService,
//   mainController,
//   originalService,
//   originalController,
//   chatFileController,
// } = require('./cleanup');

// module.exports = {
//   chat: {
//     assistants: {
//       ...assistantController,
//     },
//     workspaces: {
//       ...workspaceController,
//     },
//     folders: {
//       ...folderController,
//     },
//     files: {
//       ...fileController,
//     },
//     chatFiles: {
//       ...chatFileController,
//     },
//     messages: {
//       ...messageController,
//     },
//     sessions: {
//       ...sessionController,
//     },
//     streams: {
//       ...streamController,
//     },
//     prompts: {
//       ...promptController,
//     },
//     main: {
//       ...mainController,
//     },
//     original: {
//       ...originalController,
//     },
//   },
//   user: {
//     ...userController,
//   },
//   services: {
//     ...userService,
//     ...workspaceService,
//     ...promptService,
//     ...assistantService,
//     ...folderService,
//     ...fileService,
//     ...messageService,
//     ...sessionService,
//     ...streamService,
//     ...mainService,
//     ...originalService,
//   },
// };

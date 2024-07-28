// [routes/chat/index.js] This file is the entry point for all chat routes in the application. It imports all the chat routes and sets them up on the express app.

const express = require('express');
const router = express.Router();

const chatSessionsRoutes = require('./Sessions');
const chatMessagesRoutes = require('./Messages');
const chatWorkspacesRoutes = require('./Workspaces');
const chatPromptsRoutes = require('./Prompts');
const chatAssistantsRoutes = require('./Assistants');
const chatFoldersRoutes = require('./Folders');
const chatMiscRoutes = require('./Misc');
const chatFileRoutes = require('./ChatFiles');
const chatModelRoutes = require('./Models');
const chatToolsRoutes = require('./Tools');
const chatPresetsRoutes = require('./Presets/index.jsx');
const chatCollectionsRoutes = require('./Collections');

router.use('/workspaces', chatWorkspacesRoutes); // [ ] Fixed
router.use('/chat_sessions', chatSessionsRoutes); // [ ] Fixed
router.use('/chat_models', chatModelRoutes);
router.use('/chat_messages', chatMessagesRoutes);
router.use('/chat_prompts', chatPromptsRoutes); // [ ] Fixed
router.use('/chat_assistants', chatAssistantsRoutes);
router.use('/chat_folders', chatFoldersRoutes); // [ ] Fixed
router.use('/chat_file', chatFileRoutes);
router.use('/chat_tools', chatToolsRoutes);
router.use('/chat_presets', chatPresetsRoutes);
router.use('/chat_collections', chatCollectionsRoutes);
router.use('/v1', chatMiscRoutes); // <-- This is actually the current main chat route and also handles the streaming

module.exports = router;

// const express = require('express');
// const router = express.Router();
// // const multer = require('multer');
// const upload = require('../../middlewares/upload');
// // const upload = multer({ dest: 'uploads/' });
// const {
//   createChatSessionHandler,
//   getChatSessionHandler,
//   updateChatSessionHandler,
//   deleteChatSessionHandler,
//   getAllChatSessionsHandler,
//   getChatSessionByIdHandler,
//   updateChatSessionByIdHandler,
//   deleteChatSessionByIdHandler,
//   getChatSessionsByUserIDHandler,
//   getSimpleChatSessionsByUserIDHandler,
//   getUserActiveChatSessionHandler,
//   createOrUpdateUserActiveChatSessionHandler,
// } = require('../../controllers/chat/sessions');
// const {
//   createChatMessageHandler,
//   getChatMessageHandler,
//   updateChatMessageHandler,
//   deleteChatMessageHandler,
//   getAllChatMessagesHandler,
//   getChatMessageByIdHandler,
//   updateChatMessageByIdHandler,
//   deleteChatMessageByIdHandler,
//   getChatMessagesBySessionIdHandler,
//   getChatHistoryBySessionIdHandler,
//   deleteChatMessagesBySessionIdHandler,
// } = require('../../controllers/chat/messages');
// const { openAIChatCompletionAPIWithStreamHandler } = require('../../controllers/chat/main/controller');
// const {
//   createChatSnapshot,
//   getChatSnapshot,
//   chatSnapshotMetaByUserID,
//   updateChatSnapshotMetaById,
//   deleteChatSnapshot,
//   chatSnapshotSearch,
// } = require('../../controllers/chat/snapshot');
// const {
//   createChatPrompt,
//   getChatPromptByID,
//   updateChatPrompt,
//   deleteChatPrompt,
//   getAllChatPrompts,
//   getChatPromptsByUserID,
//   deleteChatPromptById,
//   updateChatPromptById,
// } = require('../../controllers/chat/prompts');
// const {
//   getAssistantImage,
//   uploadAssistantImage,
//   getAssistants,
//   createAssistant,
//   updateAssistant,
//   deleteAssistant,
// } = require('../../controllers/chat/assistants');
// const { chatStream, generate } = require('../../controllers/chat/original/controller');
// const {
//   createHomeWorkspace,
//   // getHomeWorkspaceByUserIdInSignup,
//   getHomeWorkspaceByUserId,
//   getWorkspacesByUserId,
//   createWorkspace,
//   updateWorkspace,
//   getWorkspaceById,
//   deleteWorkspace,
//   getWorkspaceImage,
//   uploadWorkspaceImage,
// } = require('../../controllers/chat/workspaces');
// const { getFolders, createFolder, updateFolder, deleteFolder } = require('../../controllers/chat/folders');
// // [MISC]
// router.post('/create', upload.single('pdfFile'), generate);
// // router.post('/save', saveDraft);
// // router.put('/update/:draftId', upload.single('pdfFile'), saveDraft);
// // router.delete('/delete/:draftId', saveDraft);
// // [Chat]: POST
// router.post('/stream', chatStream);
// router.post('/chat_stream', openAIChatCompletionAPIWithStreamHandler);

// // [CHAT SESSIONS]: GET, POST, PUT, DELETE
// router.post('/chat_sessions', createChatSessionHandler);
// router.get('/chat_sessions/:id', getChatSessionHandler);
// router.put('/chat_sessions/:id', updateChatSessionHandler);
// router.delete('/chat_sessions/:id', deleteChatSessionHandler);
// router.get('/chat_sessions', getAllChatSessionsHandler);
// router.get('/Id/chat_sessions/:Id', getChatSessionByIdHandler);
// router.put('/Id/chat_sessions/:Id', updateChatSessionByIdHandler);
// router.delete('/Id/chat_sessions/:Id', deleteChatSessionByIdHandler);
// router.get('/chat_sessions/users/:userID', getChatSessionsByUserIDHandler);
// router.get('/simple_chat_sessions/users/:userID', getSimpleChatSessionsByUserIDHandler);

// // [CHAT WORKSPACES]: GET, POST, PUT, DELETE
// router.post('/create-home/:userId', createHomeWorkspace);
// router.post('/upload/:workspaceId', upload.single('image'), uploadWorkspaceImage);
// router.get('/image/:workspaceId', getWorkspaceImage);
// router.get('/home/:userId', getHomeWorkspaceByUserId);
// router.get('/:workspaceId', getWorkspaceById);
// router.get('/user/:userId', getWorkspacesByUserId);
// router.post('/', createWorkspace);
// router.put('/:workspaceId', updateWorkspace);
// router.delete('/:workspaceId', deleteWorkspace);

// // [USER ACTIVE CHAT SESSION]: GET, POST, PUT
// router.get('/user_active_chat_session', getUserActiveChatSessionHandler);
// router.put('/user_active_chat_session', createOrUpdateUserActiveChatSessionHandler);

// // [CHAT SNAPSHOT]: GET, POST, PUT, DELETE
// router.post('/Id/chat_snapshot/:Id', createChatSnapshot);
// router.get('/Id/chat_snapshot/:Id', getChatSnapshot);
// router.get('/Id/chat_snapshot/all', chatSnapshotMetaByUserID);
// router.put('/Id/chat_snapshot/:Id', updateChatSnapshotMetaById);
// router.delete('/Id/chat_snapshot/:Id', deleteChatSnapshot);
// router.get('/Id/chat_snapshot_search', chatSnapshotSearch);

// // [CHAT MESSAGES]: GET, POST, PUT, DELETE
// router.post('/chat_messages', createChatMessageHandler);
// router.get('/chat_messages/:id', getChatMessageHandler);
// router.put('/chat_messages/:id', updateChatMessageHandler);
// router.delete('/chat_messages/:id', deleteChatMessageHandler);
// router.get('/chat_messages', getAllChatMessagesHandler);
// router.get('/Id/chat_messages/:Id', getChatMessageByIdHandler);
// router.put('/Id/chat_messages/:Id', updateChatMessageByIdHandler);
// router.delete('/Id/chat_messages/:Id', deleteChatMessageByIdHandler);
// router.get('/Id/chat_messages/chat_sessions/:Id', getChatMessagesBySessionIdHandler);
// router.get('/Id/chat_history/chat_sessions/:Id', getChatHistoryBySessionIdHandler);
// router.delete('/Id/chat_messages/chat_sessions/:Id', deleteChatMessagesBySessionIdHandler);

// // [CHAT PROMPTS]: GET, POST, PUT, DELETE
// router.post('/chat_prompts', createChatPrompt);
// router.get('/chat_prompts/users', getChatPromptsByUserID);
// router.get('/chat_prompts/:id', getChatPromptByID);
// router.put('/chat_prompts/:id', updateChatPrompt);
// router.delete('/chat_prompts/:id', deleteChatPrompt);
// router.get('/chat_prompts', getAllChatPrompts);
// router.delete('/Id/chat_prompts/:Id', deleteChatPromptById);
// router.put('/Id/chat_prompts/:Id', updateChatPromptById);

// // [CHAT ASSISTANTS]: GET, POST, PUT, DELETE
// router.get('/assistants/:assistantId/image', getAssistantImage);
// router.post('/assistants/:assistantId/image', upload.single('image'), uploadAssistantImage);
// router.post('/assistants', getAssistants);
// router.post('/assistants/create', createAssistant);
// router.put('/assistants/update', updateAssistant);
// router.delete('/assistants/delete', deleteAssistant);

// // [CHAT FOLDER]: GET, POST, PUT, DELETE

// router.get('/', getFolders);
// router.post('/', createFolder);
// router.put('/:id', updateFolder);
// router.delete('/:id', deleteFolder);

// module.exports = router;

// // router.post('/file/upload', upload.single('file'), uploadsController.uploadFile);
// // router.delete('/file/:filePath', uploadsController.deleteFile);
// // router.get('/file/:filePath', uploadsController.getFile);

// // [CHATS]: GET, POST, PUT, DELETE
// // router.get('/chat/:chatId', getChatById);
// // router.post('/chat', createChat);
// // router.put('/chat/:chatId', updateChat);
// // router.delete('/chat/:chatId', deleteChat);

// // Prompt Templates: GET, POST
// // Prompt Templates: GET, POST, PUT, DELETE
// // router.get('/prompt-templates', getPromptTemplates);
// // router.post('/prompt-templates', createPromptTemplate);
// // router.put('/prompt-templates/:templateId', updateTemplate);
// // router.delete('/prompt-templates/:templateId', deleteTemplate);

// // [CHAT PROMPTS]: GET, POST, PUT, DELETE
// // router.get('/prompts', getPrompts);
// // router.post('/prompts', createPrompt);
// // router.put('/prompts/:promptId', updatePrompt);
// // router.delete('/prompts/:promptId', deletePrompt);
// // router.get('/prompts/:promptId', getPromptById);
// // router.get('/prompts/workspace/:workspaceId', getPromptWorkspacesByWorkspaceId);
// // router.get('/prompts/prompt/:promptId', getPromptWorkspacesByPromptId);

// // Chats
// // router.get('/chats/:chatId', getChatById);
// // router.get('/chats/workspace/:workspaceId', getChatsByWorkspaceId);
// // router.post('/chats', createChat);
// // router.put('/chats/:chatId', updateChat);
// // router.delete('/chats/:chatId', deleteChat);

// // Messages
// // router.get('/messages/:messageId', messageController.getMessageById);
// // router.get('/messages/chat/:chatId', messageController.getMessagesByChatId);
// // router.post('/messages', messageController.createMessage);
// // router.put('/messages/:messageId', messageController.updateMessage);
// // router.delete('/messages/:messageId', messageController.deleteMessage);

// // // Prompts
// // router.get('/prompts/:promptId', promptController.getPromptById);
// // router.get('/prompts/workspace/:workspaceId', promptController.getPromptWorkspacesByWorkspaceId);
// // router.get('/prompts/prompt/:promptId', promptController.getPromptWorkspacesByPromptId);
// // router.post('/prompts', promptController.createPrompt);
// // router.put('/prompts/:promptId', promptController.updatePrompt);
// // router.delete('/prompts/:promptId', promptController.deletePrompt);

// // module.exports = router;
// // router.get('/workspaces', getWorkspaces);
// // router.post('/workspaces', createWorkspaces);
// // router.put('/workspaces', updateWorkspaces);
// // router.delete('/workspaces', deleteWorkspaces);

// // router.get('/chats', getChats);
// // router.post('/chats', createChats);
// // router.put('/chats', updateChats);
// // router.delete('/chats', deleteChats);

// // router.get('/messages', getMessages);
// // router.post('/messages', createMessages);
// // router.put('/messages', updateMessages);
// // router.delete('/messages', deleteMessages);

// // router.get('/files', getFiles);
// // router.post('/files', createFiles);
// // router.put('/files', updateFiles);
// // router.delete('/files', deleteFiles);

// // router.get('/prompts', getPrompts);
// // router.post('/prompts', createPrompts);
// // router.put('/prompts', updatePrompts);
// // router.delete('/prompts', deletePrompts);

// // router.get('/tools', getTools);
// // router.post('/tools', createTools);
// // router.put('/tools', updateTools);
// // router.delete('/tools', deleteTools);

// // router.get('/models', getModels);
// // router.post('/models', createModels);
// // router.put('/models', updateModels);
// // router.delete('/models', deleteModels);

// // router.get('/assistants', getAssistants);
// // router.post('/assistants', createAssistants);
// // router.put('/assistants/:id', updateAssistants);
// // router.delete('/assistants/:id', deleteAssistants);

// // router.get('/chat-files', getChatFiles);
// // router.post('/chat-files', createChatFiles);
// // router.put('/chat-files/:id', updateChatFiles);
// // router.delete('/chat-files/:id', deleteChatFiles);

// // router.get('/chats', getChats);
// // router.post('/chats', createChats);
// // router.put('/chats/:id', updateChats);
// // router.delete('/chats/:id', deleteChats);

// // router.get('/files', getFiles);
// // router.post('/files', createFiles);
// // router.put('/files/:id', updateFiles);
// // router.delete('/files/:id', deleteFiles);

// // router.get('/folders', getFolders);
// // router.post('/folders', createFolders);
// // router.put('/folders/:id', updateFolders);
// // router.delete('/folders/:id', deleteFolders);

// // router.get('/message-file-items', getMessageFileItems);
// // router.post('/message-file-items', createMessageFileItems);
// // router.put('/message-file-items/:id', updateMessageFileItems);
// // router.delete('/message-file-items/:id', deleteMessageFileItems);

// // router.get('/messages', getMessages);
// // router.post('/messages', createMessages);
// // router.put('/messages/:id', updateMessages);
// // router.delete('/messages/:id', deleteMessages);

// // router.get('/models', getModels);
// // router.post('/models', createModels);
// // router.put('/models/:id', updateModels);
// // router.delete('/models/:id', deleteModels);

// // router.get('/profiles', getProfiles);
// // router.post('/profiles', createProfiles);
// // router.put('/profiles/:id', updateProfiles);
// // router.delete('/profiles/:id', deleteProfiles);

// // router.get('/prompts', getPrompts);
// // router.post('/prompts', createPrompts);
// // router.put('/prompts/:id', updatePrompts);
// // router.delete('/prompts/:id', deletePrompts);

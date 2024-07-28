const express = require('express');
const { ChatSession } = require('../../../models');
const router = express.Router();
const mainControllerFile = require('../../../controllers').chat;
const controllers = mainControllerFile.sessions;

// --- ---
// Create a new chat session
router.post('/', controllers.createChatSession);
router.post('/initiate', controllers.initiateChatSession);
router.get('/default', controllers.getChatSessionDefault);
router.get('/:userId/retrieveSessions', controllers.getChatSessionsByUser);
router.delete('/:sessionId', controllers.deleteChatSession);
router.put('/:sessionId/topic', controllers.renameChatSession);
router.delete('/:sessionId/messages/clear', controllers.clearSessionChatMessages);
router.put('/:sessionId/update', controllers.updateChatSession);


// UserActiveChatSession Routes
router.post('/userActive', controllers.createUserActiveChatSession);
router.get('/active', controllers.listUserActiveChatSessions);
router.get('/userActive/:userId', controllers.getUserActiveChatSession);
router.put('/userActive/:userId/update', controllers.updateUserActiveChatSession);
router.delete('/userActive/:userId/delete', controllers.deleteUserActiveChatSession);

// --- NEW ---
router.put('/:id/messages/save', controllers.saveMessagesToChat);
router.get('/session/:id', controllers.getChatSessionBySessionId);
router.get('/session/:id/messages', controllers.getChatSessionMessagesBySessionId);
router.get('/:workspaceId/retrieveSessions', async (req, res) => {
  try {
    const chatSessions = await ChatSession.find({ workspaceId: req.params.workspaceId }).sort({ createdAt: -1 });
    res.json({ chatSessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// router.post('/', createChatSessionHandler);
// router.get('/:id', getChatSessionHandler);
// router.put('/:id', updateChatSessionHandler);
// router.delete('/:id', deleteChatSessionHandler);
// router.get('/', getAllChatSessionsHandler);

// // Use sessionId instead of Id for unique identifier endpoints
// router.get('/session/:sessionId', getChatSessionHandler);
// // router.put('/session/:sessionId', updateChatSessionByIdHandler);
// // router.delete('/session/:sessionId', deleteChatSessionByIdHandler);
// router.put('/session/:sessionId', updateChatSessionHandler);
// // User-based session routes
// router.get('/users', getChatSessionsByUserIDHandler);
// router.get('/simple/users/:userId', getSimpleChatSessionsByUserIDHandler);

// // Active chat session routes
// router.post('/active', createActiveChatSessionHandler);
// router.get('/active/:chatId', getActiveChatSessionHandler);
// router.put('/active/:chatId', updateActiveChatSessionHandler);
// // ChatSession Routes
// router.get('/main_sessions', controllers.getAllChatSessions);
// router.post('/main_sessions', controllers.createChatSession);
// router.put('/:id', controllers.updateChatSession);
// router.delete('/:id', controllers.deleteChatSession);
// router.get('/:id', controllers.getChatSessionByID);
// router.get('/id/:id', controllers.getChatSessionByID);
// router.get('/id_inactive/:id', controllers.getChatSessionByIDWithInActive);
// router.post('/id', controllers.createChatSessionByID);
// router.put('/id/:id', controllers.updateChatSessionByID);
// router.post('/id/upsert', controllers.createOrUpdateChatSessionByID);
// router.put('/id/topic/:id', controllers.updateChatSessionTopicByID);
// router.put('/id/delete/:id', controllers.deleteChatSessionByID);
// router.get('/user/:userId', controllers.getChatSessionsByUserID);
// router.get('/permission/:id/:userId', controllers.hasChatSessionPermission);
// router.put('/id/max_length/:id', controllers.updateSessionMaxLength);

// module.exports = router;

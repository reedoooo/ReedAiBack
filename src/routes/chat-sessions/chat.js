const express = require('express');
const { asyncHandler } = require('@/utils/api/sync.js');
// const authenticate = require('@/middlewares/authenticate.js');
const {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  saveMessagesToChat,
  chatStream,
} = require('../../controllers/chat-sessions/chat');
const { combinedChatStream } = require('@/utils/ai/openAi/chat/combinedStream');
const { logger } = require('@/config/logging');
const { ChatSession } = require('@/models');
const router = express.Router();

// router.use(authenticate);
// --- Chat stream endpoints ---
router.post('/stream', asyncHandler(combinedChatStream));
// --- Chat session endpoints ---
router.get('/', asyncHandler(getAllSessions));
router.get('/:id', asyncHandler(getSessionById));
router.post('/create', asyncHandler(createSession));
router.put('/:id', asyncHandler(updateSession));
router.put('/:id/messages', asyncHandler(saveMessagesToChat));
router.get(
  '/:id/messages',
  asyncHandler(async (req, res) => {
    logger.info(`Get messages for session: ${req.params.id}`);
    const session = await ChatSession.findById(req.params.id).populate('messages');
    // logger.info(`Session: ${session}`);
    logger.info(`Session MESSAGES: ${JSON.stringify(session.messages)}`);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.status(200).json({
      message: 'Messages retrieved successfully',
      messages: session.messages,
    });
  })
);
router.delete('/:id', asyncHandler(deleteSession));
router.post(
  '/session',
  asyncHandler(async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }
    const session = await ChatSession.findById(sessionId).populate('messages');
    if (session) {
      res.status(200).json(session);
    } else {
      res.status(404).json({ message: 'Session not found' });
    }
  })
);
router.post('/:id/messages/save', asyncHandler(saveMessagesToChat));
router.post('/chat-stream', asyncHandler(chatStream));

module.exports = router;

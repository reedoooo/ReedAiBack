const express = require('express');
const { asyncHandler } = require('../../utils/api/sync.js');
const authenticate = require('../../middlewares/authenticate.js');
const {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  saveMessagesToChat,
} = require('../../controllers/index.js');
const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(getAllSessions));
router.get('/:id', asyncHandler(getSessionById));
router.post('/', asyncHandler(createSession));
router.put('/:id', asyncHandler(updateSession));
router.delete('/:id', asyncHandler(deleteSession));

// Messages
router.post(
  '/session',
  asyncHandler(async (req, res) => {
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
  })
);
router.post('/:id/messages/save', asyncHandler(saveMessagesToChat));

module.exports = router;

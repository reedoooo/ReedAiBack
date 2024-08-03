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

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: API to manage sessions.
 */

/**
 * @swagger
 * /sessions:
 *   get:
 *     summary: Get all sessions
 *     tags: [Sessions]
 *     responses:
 *       200:
 *         description: List of all sessions
 */

/**
 * @swagger
 * /sessions/{id}:
 *   get:
 *     summary: Get a session by ID
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session details
 */

/**
 * @swagger
 * /sessions:
 *   post:
 *     summary: Create a new session
 *     tags: [Sessions]
 *     responses:
 *       201:
 *         description: Session created
 */

/**
 * @swagger
 * /sessions/{id}:
 *   delete:
 *     summary: Delete a session by ID
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Session deleted
 */

/**
 * @swagger
 * /sessions/{id}/messages/save:
 *   post:
 *     summary: Save messages to a session
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages saved
 */

// Define routes and handlers here
router.use(authenticate);
router.get('/', asyncHandler(getAllSessions));
router.get('/:id', asyncHandler(getSessionById));
router.post('/', asyncHandler(createSession));
router.put('/:id', asyncHandler(updateSession));
router.delete('/:id', asyncHandler(deleteSession));
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

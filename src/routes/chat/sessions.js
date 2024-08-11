const express = require('express');
const { asyncHandler } = require('@/utils/api/sync.js');
const authenticate = require('@/middlewares/authenticate.js');
const {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  saveMessagesToChat,
} = require('../../controllers/index.js');
const { ChatSession } = require('@/models/main.js');
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
router.post('/create', asyncHandler(createSession));
// router.put('/:id', asyncHandler(updateSession));
router.put('/:id', async (req, res) => {
  try {
    const { messages } = req.body;
    const session = await ChatSession.findByIdAndUpdate(
      req.params.id,
      { messages, updatedAt: Date.now() },
      { new: true }
    );
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.status(200).json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update session' });
  }
});
// update session messages (currently not used)
// Route to update session with new messages
router.put('/sessions/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required and cannot be empty.' });
    }

    // Find the session by ID
    const session = await ChatSession.findById(id);
    logger.info(`session: ${session}`);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    // Append new messages to the existing session's messages
    session.messages.push(...messages);
    session.updatedAt = Date.now(); // Update the last modified time

    // Save the updated session
    const updatedSession = await session.save();

    res.status(200).json(updatedSession);
  } catch (error) {
    console.error('Error updating session with messages:', error);
    res.status(500).json({ error: 'Failed to update session with messages.' });
  }
});
// get session messages
router.get('/:id/messages', async (req, res) => {
  try {
    const session = await ChatSession.findById(req.params.id).populate('messages');
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.status(200).json(session.messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get session messages' });
  }
});
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

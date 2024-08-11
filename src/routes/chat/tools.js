const express = require('express');
const { asyncHandler } = require('@/utils/api/sync.js');
const authenticate = require('@/middlewares/authenticate.js');
const {
  getAllChatTools,
  getChatToolById,
  createChatTool,
  updateChatTool,
  deleteChatTool,
} = require('../../controllers/index.js');
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Tools
 *   description: API to manage tools.
 */

/**
 * @swagger
 * /tools:
 *   get:
 *     summary: Get all tools
 *     tags: [Tools]
 *     responses:
 *       200:
 *         description: List of all tools
 */

/**
 * @swagger
 * /tools/{id}:
 *   get:
 *     summary: Get a tool by ID
 *     tags: [Tools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tool details
 */

/**
 * @swagger
 * /tools:
 *   post:
 *     summary: Create a new tool
 *     tags: [Tools]
 *     responses:
 *       201:
 *         description: Tool created
 */

// Define routes and handlers here

router.use(authenticate); // Apply authentication middleware to all routes
router.get('/', asyncHandler(getAllChatTools));
router.get('/:id', asyncHandler(getChatToolById));
router.post('/', asyncHandler(createChatTool));
router.put('/:id', asyncHandler(updateChatTool));
router.delete('/:id', asyncHandler(deleteChatTool));

module.exports = router;

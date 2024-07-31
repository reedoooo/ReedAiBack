const express = require('express');
const { asyncHandler } = require('../../utils/api/sync.js');
const authenticate = require('../../middlewares/authenticate.js');
const {
  getAllChatTools,
  getChatToolById,
  createChatTool,
  updateChatTool,
  deleteChatTool,
} = require('../../controllers/index.js');
const router = express.Router();

router.use(authenticate); // Apply authentication middleware to all routes

router.get('/', asyncHandler(getAllChatTools));
router.get('/:id', asyncHandler(getChatToolById));
router.post('/', asyncHandler(createChatTool));
router.put('/:id', asyncHandler(updateChatTool));
router.delete('/:id', asyncHandler(deleteChatTool));

module.exports = router;

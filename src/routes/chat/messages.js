const express = require('express');
const { asyncHandler } = require('@/utils/api/sync.js');
const authenticate = require('@/middlewares/authenticate.js');
const {
  getAllChatMessages,
  getChatMessageById,
  createChatMessage,
  updateChatMessage,
  deleteChatMessage,
} = require('../../controllers/index.js');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(getAllChatMessages));
router.get('/:id', asyncHandler(getChatMessageById));
router.post('/', asyncHandler(createChatMessage));
router.put('/:id', asyncHandler(updateChatMessage));
router.delete('/:id', asyncHandler(deleteChatMessage));

module.exports = router;

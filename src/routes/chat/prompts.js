const express = require('express');
const { asyncHandler } = require('@/utils/api/sync.js');
const authenticate = require('@/middlewares/authenticate.js');
const {
  getAllChatPrompts,
  getChatPromptById,
  createChatPrompt,
  updateChatPrompt,
  deleteChatPrompt,
} = require('../../controllers/index.js');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(getAllChatPrompts));
router.get('/:id', asyncHandler(getChatPromptById));
router.post('/', asyncHandler(createChatPrompt));
router.put('/:id', asyncHandler(updateChatPrompt));
router.delete('/:id', asyncHandler(deleteChatPrompt));

module.exports = router;

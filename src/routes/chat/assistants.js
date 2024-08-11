const express = require('express');
const { asyncHandler } = require('@/utils/api/sync.js');
const {
  getAllChatAssistants,
  getChatAssistantById,
  createChatAssistant,
  updateChatAssistant,
  deleteChatAssistant,
} = require('../../controllers/index.js');
const authenticate = require('@/middlewares/authenticate.js');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(getAllChatAssistants));
router.get('/:id', asyncHandler(getChatAssistantById));
router.post('/', asyncHandler(createChatAssistant));
router.put('/:id', asyncHandler(updateChatAssistant));
router.delete('/:id', asyncHandler(deleteChatAssistant));

module.exports = router;

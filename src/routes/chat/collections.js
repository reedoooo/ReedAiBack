const express = require('express');
const router = express.Router();
const { asyncHandler } = require('@/utils/api/sync.js');
const authenticate = require('@/middlewares/authenticate.js');
const {
  getAllChatCollections,
  getChatCollectionById,
  createChatCollection,
  updateChatCollection,
  deleteChatCollection,
} = require('../../controllers/index.js');

router.use(authenticate);

router.get('/', asyncHandler(getAllChatCollections));
router.get('/:id', asyncHandler(getChatCollectionById));
router.post('/', asyncHandler(createChatCollection));
router.put('/:id', asyncHandler(updateChatCollection));
router.delete('/:id', asyncHandler(deleteChatCollection));

module.exports = router;

const express = require('express');
const { asyncHandler } = require('../../utils/api/sync.js');
const authenticate = require('../../middlewares/authenticate.js');
const {
  getAllChatModels,
  getChatModelById,
  createChatModel,
  updateChatModel,
  deleteChatModel,
} = require('../../controllers/index.js');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(getAllChatModels));
router.get('/:id', asyncHandler(getChatModelById));
router.post('/', asyncHandler(createChatModel));
router.put('/:id', asyncHandler(updateChatModel));
router.delete('/:id', asyncHandler(deleteChatModel));

module.exports = router;

const express = require('express');
const { asyncHandler } = require('@/utils/api/sync.js');
const authenticate = require('@/middlewares/authenticate.js');
const {
  getAllChatFolders,
  getChatFolderById,
  createChatFolder,
  updateChatFolder,
  deleteChatFolder,
} = require('../../controllers/index.js');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(getAllChatFolders));
router.get('/:id', asyncHandler(getChatFolderById));
router.post('/', asyncHandler(createChatFolder));
router.put('/:id', asyncHandler(updateChatFolder));
router.delete('/:id', asyncHandler(deleteChatFolder));

module.exports = router;

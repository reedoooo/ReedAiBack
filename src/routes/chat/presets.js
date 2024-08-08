const express = require('express');
const { asyncHandler } = require('../../utils/api/sync.js');
const authenticate = require('../../middlewares/authenticate.js');
const {
  getAllChatPresets,
  getChatPresetById,
  createChatPreset,
  updateChatPreset,
  deleteChatPreset,
} = require('../../controllers/index.js');
const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(getAllChatPresets));
router.get('/:id', asyncHandler(getChatPresetById));
router.post('/', asyncHandler(createChatPreset));
router.put('/:id', asyncHandler(updateChatPreset));
router.delete('/:id', asyncHandler(deleteChatPreset));

module.exports = router;

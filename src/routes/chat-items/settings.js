const express = require('express');
const { asyncHandler } = require('@/utils/api/sync.js');
const {
  ChatPresetController,
  ChatToolController,
  ChatModelController,
  ChatPromptController,
  ChatCollectionController,
} = require('@/controllers');
// const authenticate = require('@/middlewares/authenticate.js');
// const {
// ChatPresetController,
// ChatToolController,
// ChatModelController,
// ChatPromptController,
// ChatCollectionController,
// } = require('../../config/env/controllers/chat-items/settings.js');

const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authenticate);

// Chat Preset routes
router.get('/presets', asyncHandler(ChatPresetController.getAll));
router.get('/presets/:id', asyncHandler(ChatPresetController.getById));
router.post('/presets', asyncHandler(ChatPresetController.create));
router.put('/presets/:id', asyncHandler(ChatPresetController.update));
router.delete('/presets/:id', asyncHandler(ChatPresetController.delete));

// Chat Tool routes
router.get('/tools', asyncHandler(ChatToolController.getAll));
router.get('/tools/:id', asyncHandler(ChatToolController.getById));
router.post('/tools', asyncHandler(ChatToolController.create));
router.put('/tools/:id', asyncHandler(ChatToolController.update));
router.delete('/tools/:id', asyncHandler(ChatToolController.delete));

// Chat Model routes
router.get('/models', asyncHandler(ChatModelController.getAll));
router.get('/models/:id', asyncHandler(ChatModelController.getById));
router.post('/models', asyncHandler(ChatModelController.create));
router.put('/models/:id', asyncHandler(ChatModelController.update));
router.delete('/models/:id', asyncHandler(ChatModelController.delete));

// Chat Prompt routes
router.get('/prompts', asyncHandler(ChatPromptController.getAll));
router.get('/prompts/:id', asyncHandler(ChatPromptController.getById));
router.post('/prompts', asyncHandler(ChatPromptController.create));
router.put('/prompts/:id', asyncHandler(ChatPromptController.update));
router.delete('/prompts/:id', asyncHandler(ChatPromptController.delete));

// Chat Collection routes
router.get('/collections', asyncHandler(ChatCollectionController.getAll));
router.get('/collections/:id', asyncHandler(ChatCollectionController.getById));
router.post('/collections', asyncHandler(ChatCollectionController.create));
router.put('/collections/:id', asyncHandler(ChatCollectionController.update));
router.delete('/collections/:id', asyncHandler(ChatCollectionController.delete));

module.exports = router;

const express = require('express');
const { Workspace } = require('../../../models');
const router = express.Router();
const controller = require('../../../controllers').chat;

const {
  createChatPrompt,
  getChatPromptById,
  updateChatPrompt,
  deleteChatPrompt,
  getAllChatPrompts,
  getChatPromptsByUserId,
  deleteChatPromptById,
  updateChatPromptById,
} = controller.prompts;

// Chat Prompts Routes
router.post('/', createChatPrompt);
router.get('/:promptId', getChatPromptById);
router.get('/:userId/retrievePrompts', getChatPromptsByUserId);
router.put('/:promptId/update', updateChatPrompt);
router.delete('/:promptId/delete', deleteChatPrompt);
router.get('/:workspaceId/retrievePrompts', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId).populate('prompts');
    res.json({ workspace });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

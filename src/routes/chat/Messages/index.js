const express = require('express');
const router = express.Router();
const controller = require('../../../controllers').chat;
const {
  createChatMessageHandler,
  getChatMessageHandler,
  updateChatMessageHandler,
  deleteChatMessageHandler,
  getAllChatMessagesHandler,
  // getChatMessageByIdHandler,
  updateChatMessageByIdHandler,
  deleteChatMessageByIdHandler,
  getChatMessagesBySessionIdHandler,
  getChatHistoryBySessionIdHandler,
  deleteChatMessagesBySessionIdHandler,
} = controller.messages;

// Chat Messages Routes
router.post('/', createChatMessageHandler);
router.get('/:id', getChatMessageHandler);
  router.put('/:id', updateChatMessageHandler);
router.delete('/:id', deleteChatMessageHandler);
router.get('/', getAllChatMessagesHandler);
// router.get('/uuid/:uuid', getChatMessageByIdHandler);
router.put('/id/:id', updateChatMessageByIdHandler);
router.delete('/id/:id', deleteChatMessageByIdHandler);
router.get('/session/:id', getChatMessagesBySessionIdHandler);
router.get('/history/:id', getChatHistoryBySessionIdHandler);
router.delete('/session/:id', deleteChatMessagesBySessionIdHandler);

module.exports = router;

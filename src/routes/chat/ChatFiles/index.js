const express = require('express');
const { handleSingleUpload } = require('../../../middlewares/uploads');
const router = express.Router();
const controller = require('../../../controllers').chat;
const {
  getChatFilesByChatId,
  createChatFile,
  createChatFiles,
  receiveFile,
  downloadFile,
  deleteFile,
  chatFilesBySessionId,
} = controller.chatFiles;

// /api/chat_file/
router.post('/upload/chatFile', handleSingleUpload, receiveFile);
router.get('/:chatFileId/list', chatFilesBySessionId);
router.get('/download/:id', downloadFile);
router.delete('/download/:id', deleteFile);

router.get('/chatFile/:id', getChatFilesByChatId);
router.post('/', createChatFile);
router.post('/', createChatFiles);

module.exports = router;

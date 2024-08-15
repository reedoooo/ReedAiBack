const express = require('express');
const { asyncHandler } = require('@/utils/api/sync.js');
const authenticate = require('@/middlewares/authenticate.js');
const {
  getMessagesByChatSessionId,
  getMessageById,
  createMessage,
  createMessages,
  updateMessage,
  deleteMessage,
  deleteMessagesIncludingAndAfter,
} = require('@/controllers');

const router = express.Router();

router.use(authenticate);

router.get('/:id', asyncHandler(getMessagesByChatSessionId));
router.get('/message/:id', asyncHandler(getMessageById));
router.post('/', asyncHandler(createMessage));
router.post('/bulk', asyncHandler(createMessages));
router.put('/:id', asyncHandler(updateMessage));
router.delete('/:id', asyncHandler(deleteMessage));
router.delete('/delete-including-and-after', asyncHandler(deleteMessagesIncludingAndAfter));

module.exports = router;

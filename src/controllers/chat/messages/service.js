const { Message: ChatMessage } = require('../../../models');

async function createChatMessage(messageParams) {
  try {
    const message = new ChatMessage(messageParams);
    await message.save();
    return message;
  } catch (err) {
    throw new Error('Failed to create message: ' + err.message);
  }
}

async function getChatMessageById(id) {
  try {
    const message = await ChatMessage.findById(id);
    if (!message) throw new Error('Message not found');
    return message;
  } catch (err) {
    throw new Error('Failed to get message: ' + err.message);
  }
}

async function updateChatMessage(id, messageParams) {
  try {
    const message = await ChatMessage.findByIdAndUpdate(id, messageParams, { new: true });
    if (!message) throw new Error('Message not found');
    return message;
  } catch (err) {
    throw new Error('Failed to update message: ' + err.message);
  }
}

async function deleteChatMessage(id) {
  try {
    await ChatMessage.findByIdAndDelete(id);
  } catch (err) {
    throw new Error('Failed to delete message: ' + err.message);
  }
}

async function getAllChatMessages() {
  try {
    const messages = await ChatMessage.find();
    return messages;
  } catch (err) {
    throw new Error('Failed to retrieve messages: ' + err.message);
  }
}

// async function getChatMessageById(uuid) {
//   try {
//     const message = await ChatMessage.findOne({ uuid });
//     if (!message) throw new Error('Message not found');
//     return message;
//   } catch (err) {
//     throw new Error('Failed to retrieve message: ' + err.message);
//   }
// }

async function updateChatMessageById(uuid, messageParams) {
  try {
    const message = await ChatMessage.findOneAndUpdate({ uuid }, messageParams, { new: true });
    if (!message) throw new Error('Message not found');
    return message;
  } catch (err) {
    throw new Error('Failed to update message: ' + err.message);
  }
}

async function deleteChatMessageById(uuid) {
  try {
    await ChatMessage.findOneAndDelete({ uuid });
  } catch (err) {
    throw new Error('Failed to delete message: ' + err.message);
  }
}

async function getChatMessagesBySessionId(uuid, pageNum, pageSize) {
  try {
    const messages = await ChatMessage.find({ sessionUuid: uuid })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize);
    return messages;
  } catch (err) {
    throw new Error('Failed to retrieve messages: ' + err.message);
  }
}

async function getChatHistoryBySessionId(uuid, pageNum, pageSize) {
  try {
    const messages = await ChatMessage.find({ sessionUuid: uuid })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize);
    return messages;
  } catch (err) {
    throw new Error('Failed to retrieve messages: ' + err.message);
  }
}

async function deleteChatMessagesBySessionId(uuid) {
  try {
    await ChatMessage.deleteMany({ sessionUuid: uuid });
  } catch (err) {
    throw new Error('Failed to delete messages: ' + err.message);
  }
}

module.exports = {
  createChatMessage,
  getChatMessageById,
  updateChatMessage,
  deleteChatMessage,
  getAllChatMessages,
  // getChatMessageById,
  updateChatMessageById,
  deleteChatMessageById,
  getChatMessagesBySessionId,
  getChatHistoryBySessionId,
  deleteChatMessagesBySessionId,
};

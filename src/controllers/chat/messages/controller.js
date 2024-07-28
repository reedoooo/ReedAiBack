const {
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
} = require('./service.js');

async function createChatMessageHandler(req, res) {
  try {
    const message = await createChatMessage(req.body);
    res.json(message);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

async function getChatMessageHandler(req, res) {
  try {
    const id = req.params.id;
    const message = await getChatMessageById(id);
    res.json(message);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

async function updateChatMessageHandler(req, res) {
  try {
    const id = req.params.id;
    const message = await updateChatMessage(id, req.body);
    res.json(message);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

async function deleteChatMessageHandler(req, res) {
  try {
    const id = req.params.id;
    await deleteChatMessage(id);
    res.sendStatus(200);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

async function getAllChatMessagesHandler(req, res) {
  try {
    const messages = await getAllChatMessages();
    res.json(messages);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

// async function getChatMessageByIdHandler(req, res) {
//   try {
//     const uuid = req.params.uuid;
//     const message = await getChatMessageById(uuid);
//     res.json(message);
//   } catch (err) {
//     res.status(400).send(err.message);
//   }
// }

async function updateChatMessageByIdHandler(req, res) {
  try {
    const messageParams = req.body;
    const message = await updateChatMessageById(req.params.uuid, messageParams);
    res.json(message);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

async function deleteChatMessageByIdHandler(req, res) {
  try {
    const uuid = req.params.uuid;
    await deleteChatMessageById(uuid);
    res.sendStatus(200);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

async function getChatMessagesBySessionIdHandler(req, res) {
  try {
    const uuid = req.params.uuid;
    const pageNum = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.page_size) || 200;
    const messages = await getChatMessagesBySessionId(uuid, pageNum, pageSize);
    res.json(messages);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

async function getChatHistoryBySessionIdHandler(req, res) {
  try {
    const uuid = req.params.uuid;
    const pageNum = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.page_size) || 200;
    const messages = await getChatHistoryBySessionId(uuid, pageNum, pageSize);
    res.json(messages);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

async function deleteChatMessagesBySessionIdHandler(req, res) {
  try {
    const uuid = req.params.uuid;
    await deleteChatMessagesBySessionId(uuid);
    res.sendStatus(200);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

module.exports = {
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
};

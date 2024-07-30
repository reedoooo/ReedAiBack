const { Snapshot, ChatMessage, ChatSession } = require('../../../models');

async function createChatSnapshot(sessionUuid, userId) {
  const chatSession = await ChatSession.findOne({ uuid: sessionUuid });
  if (!chatSession) {
    throw new Error('Chat session not found');
  }

  const simpleMsgs = await ChatMessage.find({ sessionUuid });
  const text = simpleMsgs.reduce((acc, curr) => acc + curr.text, '');

  const simpleMsgsRaw = JSON.stringify(simpleMsgs);
  const snapshotUuid = uuidv4();
  const chatSessionMessage = JSON.stringify(chatSession);

  const chatSnapshot = new Snapshot({
    uuid: snapshotUuid,
    model: chatSession.model,
    title: chatSession.topic.substring(0, 100),
    userID: userId,
    session: chatSessionMessage,
    tags: {},
    text,
    conversation: simpleMsgsRaw,
  });

  await chatSnapshot.save();
  return chatSnapshot.uuid;
}

module.exports = {
  createChatSnapshotService: createChatSnapshot,
};

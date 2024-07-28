const { ObjectId } = require('mongodb');

const selectUserByEmail = async (db, email) => {
  return await db.collection('users').findOne({ email });
};

const selectChatSessionsByUserId = async (db, userId) => {
  return await db
    .collection('sessions')
    .find({ userId: ObjectId(userId) })
    .toArray();
};

const selectChatPromptsBySessionId = async (db, sessionId) => {
  return await db.collection('prompts').find({ sessionId }).toArray();
};

const selectChatMessagesBySessionId = async (db, sessionId) => {
  return await db.collection('messages').find({ sessionId }).toArray();
};

module.exports = {
  selectUserByEmail,
  selectChatSessionsByUserId,
  selectChatPromptsBySessionId,
  selectChatMessagesBySessionId,
};

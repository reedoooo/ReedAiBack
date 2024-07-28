const { ObjectId } = require('mongodb');

const createUser = async (db, email, password) => {
  const result = await db.collection('users').insertOne({ email, password });
  return result.ops[0];
};

const createSession = async (db, userId) => {
  const result = await db.collection('sessions').insertOne({ userId: ObjectId(userId), createdAt: new Date() });
  return result.ops[0];
};

const createPrompt = async (db, sessionId, userId) => {
  const result = await db
    .collection('prompts')
    .insertOne({ sessionId, userId: ObjectId(userId), createdAt: new Date() });
  return result.ops[0];
};

const createMessage = async (db, sessionId, userId, content) => {
  const result = await db
    .collection('messages')
    .insertOne({ sessionId, userId: ObjectId(userId), content, createdAt: new Date() });
  return result.ops[0];
};

module.exports = {
  createUser,
  createSession,
  createPrompt,
  createMessage,
};

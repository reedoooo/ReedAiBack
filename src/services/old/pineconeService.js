// const pinecone = require('../config/pinecone');

// exports.addMessageToPinecone = async (sessionId, message) => {
//   const vector = await pinecone.vectorize(message.content);
//   await pinecone.upsert({
//     index: 'chat-messages',
//     vectors: [{ id: `${sessionId}-${message.timestamp}`, values: vector }],
//   });
// };
const { ChatSession, Prompt, Model, Message } = require('../../../models');
const getChatSessionByUuid = async uuid => {
  return ChatSession.findOne({ uuid });
};

const getChatModelByName = async name => {
  return Model.findOne({ name });
};

const getChatPromptBySessionUuid = async sessionUuid => {
  return Prompt.findOne({ sessionUuid });
};

const createChatPrompt = async chatPrompt => {
  return Prompt.create(chatPrompt);
};

const createChatMessage = async chatMessage => {
  return Message.create(chatMessage);
};
// const createNewUserMessage = async messageParams => {
//   return ChatMessage.create({
//     ...messageParams,
//     role: 'user',
//   });
// };
// const createNewAssistantMessage = async messageParams => {
//   return ChatMessage.create({
//     ...messageParams,
//     role: 'assistant',
//   });
// };
// const createNewSystemMessage = async messageParams => {
//   return ChatMessage.create({
//     ...messageParams,
//     role: 'system',
//   });
// };
const updateChatMessage = async (uuid, update) => {
  return ChatMessage.updateOne({ uuid }, { $set: update });
};

const getChatMessages = async (sessionUuid, chatUuid, regenerate) => {
  // Implement getAskMessages function logic here
  // return ChatMessage.find({ sessionUuid });
};

const logChat = async (chatSession, msgs, answerText) => {
  // Implement logChat function logic here
};

module.exports = {
  getChatSessionByUuid,
  getChatModelByName,
  getChatPromptBySessionUuid,
  createChatPrompt,
  createChatMessage,
  updateChatMessage,
  getChatMessages,
  logChat,
};

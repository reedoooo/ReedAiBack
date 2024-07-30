const { Prompt, ChatMessage } = require('../../../models');
const { getTokenCount } = require('../../../utils');

async function getAskMessages(chatSession, chatUuid, regenerate) {
  const lastN = chatSession.maxLength || 10;
  const chatPrompts = await Prompt.find({ sessionUuid: chatSession.uuid });
  let chatMessages;
  if (regenerate) {
    // LEARNING NOTE: The { $ne: chatUuid } part uses MongoDB's $ne (not equal) operator to exclude a specific chat message from the results, likely the current message or a message that should not be retrieved for some reason.
    chatMessages = await ChatMessage.find({ sessionUuid: chatSession.uuid, uuid: { $ne: chatUuid } }).limit(lastN);
  } else {
    chatMessages = await ChatMessage.find({ sessionUuid: chatSession.uuid }).sort({ createdAt: -1 }).limit(lastN);
  }

  const chatPromptMessages = chatPrompts.map(m => ({ role: m.role, content: m.content, tokenCount: m.tokenCount }));
  const chatMessageMessages = chatMessages.map(m => ({ role: m.role, content: m.content, tokenCount: m.tokenCount }));
  return chatPromptMessages.concat(chatMessageMessages);
}

async function createChatPromptSimple(sessionUuid, newQuestion, userId) {
  const tokenCount = getTokenCount(newQuestion); // Implement getTokenCount function
  const chatPrompt = new Prompt({
    uuid: uuidv4(),
    sessionUuid: sessionUuid,
    role: 'system',
    content: newQuestion,
    userId,
    createdBy: userId,
    updatedBy: userId,
    tokenCount,
  });
  await chatPrompt.save();
  return chatPrompt;
}

async function createChatMessageSimple(sessionUuid, messageUuid, role, content, userID, baseURL, isSummarizeMode) {
  const tokenCount = getTokenCount(content); // Implement getTokenCount function
  // const summary = isSummarizeMode && tokenCount > 300 ? await summarizeContent(baseURL, content) : ''; // Implement summarizeContent function
  let summary = '';

  if (isSummarizeMode && tokenCount > 300) {
    summary = await llmSummarizeWithTimeout(baseURL, content);
  }
  const chatMessage = new ChatMessage({
    sessionUuid: sessionUuid,
    uuid: messageUuid,
    role,
    content,
    userID,
    createdBy: userID,
    updatedBy: userID,
    summary: summary,
    tokenCount,
    raw: {},
  });
  await chatMessage.save();
  return chatMessage;
}

async function updateChatMessageContent(uuid, content) {
  const tokenCount = getTokenCount(content); // Implement getTokenCount function
  await ChatMessage.findOneAndUpdate({ uuid }, { content, tokenCount });
}

async function logChat(chatSession, msgs, answerText) {
  const sessionRaw = JSON.stringify(chatSession);
  const question = JSON.stringify(msgs);
  const answerRaw = JSON.stringify(answerText);
  // Implement logic to store chat log in your database
  const chatLog = new ChatLog({
    session: sessionRaw,
    question,
    answer: answerRaw,
  });

  await chatLog.save();
}

module.exports = {
  getAskMessages,
  createChatPromptSimple,
  createChatMessageSimple,
  updateChatMessageContent,
  logChat,
};

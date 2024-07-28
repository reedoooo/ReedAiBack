const { Prompt: ChatPrompt } = require('../../../models');
const { getTokenCount } = require('../../../utils');
async function createChatPrompt(promptParams) {
  const prompt = new ChatPrompt(promptParams);
  await prompt.save();
  return prompt;
}

async function getChatPromptById(id) {
  const prompt = await ChatPrompt.findById(id);
  if (!prompt) {
    throw new Error('Chat prompt not found');
  }
  return prompt;
}

async function updateChatPrompt(id, promptParams) {
  const prompt = await ChatPrompt.findByIdAndUpdate(id, promptParams, { new: true });
  if (!prompt) {
    throw new Error('Chat prompt not found');
  }
  return prompt;
}

async function deleteChatPrompt(id) {
  await ChatPrompt.findByIdAndDelete(id);
}

async function getAllChatPrompts() {
  const prompts = await ChatPrompt.find();
  return prompts;
}

async function getChatPromptsByUserId(userID) {
  const prompts = await ChatPrompt.find({ userID });
  return prompts;
}

async function deleteChatPromptById(uuid) {
  await ChatPrompt.findOneAndDelete({ uuid });
}

async function updateChatPromptById(uuid, content) {
  const tokenCount = await getTokenCount(content);
  const prompt = await ChatPrompt.findOneAndUpdate({ uuid }, { content, tokenCount }, { new: true });
  if (!prompt) {
    throw new Error('Chat prompt not found');
  }
  return prompt;
}

module.exports = {
  createChatPrompt,
  getChatPromptById,
  updateChatPrompt,
  deleteChatPrompt,
  getAllChatPrompts,
  getChatPromptsByUserId,
  deleteChatPromptById,
  updateChatPromptById,
};

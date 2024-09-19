const { ToolMessage, SystemMessage, HumanMessage } = require('@langchain/core/messages');
const { assistantPrompts } = require('./static/assistant');
const { systemPrompts } = require('./static/system');
const { SystemMessagePromptTemplate } = require('@langchain/core/prompts');
const { toolPrompts } = require('../functions');

const getPromptByName = (type, name) => {
  if (type === 'system') {
    systemPrompts[name];
  }
  if (type === 'user') {
  }
  if (type === 'assistant') {
    assistantPrompts[name];
  }
  if (type === 'function') {
    toolPrompts[name];
  }
};
const createPrompt = (type, name) => {
  const prompt = getPromptByName(type, name);
  return {
    role: type,
    content: prompt,
  };
};
const getMainSystemMessageContent = () => {
  return systemPrompts['UI_UX_EXPERT'];
};
const getMainAssistantMessageInstructions = () => {
  return assistantPrompts['REACT_GUIDE'];
};
const getMainToolMessageContent = () => createPrompt('tool', 'SUMMARIZE_MESSAGES');

module.exports = {
  createPrompt,
  getMainSystemMessageContent,
  getMainAssistantMessageInstructions,
  getMainToolMessageContent,
};

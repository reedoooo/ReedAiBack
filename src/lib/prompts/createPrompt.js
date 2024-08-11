const { ToolMessage, SystemMessage, HumanMessage } = require('@langchain/core/messages');
const { assistantPrompts } = require('./assistant');
const { tools, toolPrompts } = require('./function');
const { systemPrompts } = require('./system');
const { SystemMessagePromptTemplate } = require('@langchain/core/prompts');

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
  return systemPrompts['FORMATTING'];
};
const getMainAssistantMessageInstructions = () => {
  return assistantPrompts['CODING_REACT'];
};
const getMainToolMessageContent = () => createPrompt('tool', 'SUMMARIZE_MESSAGES');

module.exports = {
  createPrompt,
  getMainSystemMessageContent,
  getMainAssistantMessageInstructions,
  getMainToolMessageContent,
};

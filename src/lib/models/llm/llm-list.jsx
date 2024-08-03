const LLM = require('@/types').LLM;
const ANTHROPIC_LLM_LIST = require('./anthropic-llm-list').ANTHROPIC_LLM_LIST;
const GOOGLE_LLM_LIST = require('./google-llm-list').GOOGLE_LLM_LIST;
const OPENAI_LLM_LIST = require('./openai-llm-list').OPENAI_LLM_LIST;
const PERPLEXITY_LLM_LIST =
  require('./perplexity-llm-list').PERPLEXITY_LLM_LIST;

const LLM_LIST = [
  ...OPENAI_LLM_LIST,
  ...GOOGLE_LLM_LIST,
  ...PERPLEXITY_LLM_LIST,
  ...ANTHROPIC_LLM_LIST,
];

const LLM_LIST_MAP = {
  openai: OPENAI_LLM_LIST,
  google: GOOGLE_LLM_LIST,
  perplexity: PERPLEXITY_LLM_LIST,
  anthropic: ANTHROPIC_LLM_LIST,
};

module.exports = {
  LLM_LIST,
  LLM_LIST_MAP,
};

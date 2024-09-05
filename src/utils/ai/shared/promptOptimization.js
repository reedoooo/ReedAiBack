// utils/openAIUtils.js
// import { OpenAI } from 'langchain/llms/openai';
// import { PromptTemplate } from 'langchain/prompts';
// import { LLMChain } from 'langchain/chains';
// import { initializeVectorStore } from './vectorStore.js';

const { OpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { PineconeStore } = require('@langchain/pinecone');
const { createPineconeIndex } = require('../pinecone');
const { Pinecone } = require('@pinecone-database/pinecone');
const { getEnv } = require('@/utils/api');

const llm = new OpenAI({
	model: getEnv('EMBEDDING_MODEL') || process.env.EMBEDDING_MODEL,
  temperature: 0.7,
  maxTokens: 500,
	apiKey: process.env.OPENAI_API_PROJECT_KEY, // Ensure your API key is set in the environment variables
});

const generateOptimizedPrompt = async input => {
  const template = `
    Given the user input: {input}

    Generate an optimized prompt that:
    1. Clarifies any ambiguities in the input
    2. Adds relevant context or background information
    3. Specifies the desired output format or structure
    4. Encourages a comprehensive and detailed response
    5. Includes any necessary constraints or guidelines

    Optimized prompt:
  `;

  const promptTemplate = new PromptTemplate({
    template: template,
    inputVariables: ['input'],
  });

  const chain = new LLMChain({ llm, prompt: promptTemplate });
  const result = await chain.call({ input });
  return result.text;
};
const performSemanticSearch = async (query, k = 3) => {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  const vectorStore = await PineconeStore.fromExistingIndex(embedder, {
    pineconeIndex: await createPineconeIndex(pinecone, pineconeIndex),
    namespace: 'chat-history',
    textKey: 'text',
  });
  const results = await vectorStore.similaritySearch(query, k);
  return results.map(result => result.pageContent);
};

const generateResponse = async (input, context) => {
  const template = `
    You are a helpful AI assistant. Use the following context to answer the human's question:

    Context: {context}

    Human: {input}
    AI: Let's approach this step-by-step:
  `;

  const promptTemplate = new PromptTemplate({
    template: template,
    inputVariables: ['context', 'input'],
  });

  const result = await llm.invoke(promptTemplate.format({ context, input }));
  return result.text;
};

const summarizeText = async text => {
  const template = `
    Summarize the following text in a concise manner:

    {text}

    Summary:
  `;

  const promptTemplate = new PromptTemplate({
    template: template,
    inputVariables: ['text'],
  });

  const result = await llm.invoke(promptTemplate.format({ text }));
  return result.text;
};

const extractKeywords = async text => {
  const template = `
    Extract the main keywords from the following text:

    {text}

    Keywords (comma-separated):
  `;

  const promptTemplate = new PromptTemplate({
    template: template,
    inputVariables: ['text'],
  });

  const result = await llm.invoke(promptTemplate.format({ text }));
  return result.text.split(',').map(keyword => keyword.trim());
};

module.exports = {
  generateOptimizedPrompt,
  performSemanticSearch,
  generateResponse,
  summarizeText,
  extractKeywords,
};

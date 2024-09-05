const { ConversationChain } = require('langchain/chains');
const { Conversation } = require('@/models/conversation.js');
const {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
} = require('@langchain/core/prompts');
const {
  generateOptimizedPrompt,
  performSemanticSearch,
  generateResponse,
  summarizeText,
  extractKeywords,
} = require('@/utils/ai/shared/promptOptimization.js');
const { logger } = require('@/config/logging');
const { ChatOpenAI } = require('@langchain/openai');

const chat = new ChatOpenAI({
  modelName: 'gpt-4',
  temperature: 0.7,
  maxTokens: 500,
  apiKey: process.env.OPENAI_API_PROJECT_KEY, // Ensure your API key is set in the environment variables
});

const chatPrompt = ChatPromptTemplate.fromPromptMessages([
  SystemMessagePromptTemplate.fromTemplate(
    "You are a helpful AI assistant. Use the following context to answer the human's questions: {context}"
  ),
  new MessagesPlaceholder('history'),
  HumanMessagePromptTemplate.fromTemplate('{input}'),
]);

const handleChat = async (request, reply) => {
  try {
    const { input } = request.body;
    const userId = request.user.id;

    const cachedResponse = await request.cache.get(`chat:${userId}:${input}`);
    if (cachedResponse) {
      return JSON.parse(cachedResponse);
    }

    const optimizedPrompt = await generateOptimizedPrompt(input);
    const relevantDocs = await performSemanticSearch(optimizedPrompt);
    const context = relevantDocs.join('\n');

    const memory = new RedisChatMessageHistory({
      sessionId: userId,
      url: process.env.REDIS_URL,
    });

    const chain = new ConversationChain({
      memory,
      prompt: chatPrompt,
      llm: chat,
    });

    const response = await generateResponse(optimizedPrompt, context);

    const summary = await summarizeText(response);
    const keywords = await extractKeywords(response);

    await Conversation.create({
      userId,
      message: input,
      response,
      summary,
      keywords,
    });

    const result = { response, summary, keywords };
    await request.cache.set(`chat:${userId}:${input}`, JSON.stringify(result), process.env.CACHE_TTL);

    return result;
  } catch (error) {
    logger.error('Error in chat handler:', error);
    throw new Error('An error occurred while processing your request.');
  }
};

const getConversationHistory = async (request, reply) => {
  try {
    const userId = request.user.id;
    const history = await Conversation.find({ userId }).sort('-createdAt').limit(50);
    return history;
  } catch (error) {
    logger.error('Error fetching conversation history:', error);
    throw new Error('An error occurred while fetching conversation history.');
  }
};

const streamChat = async (request, reply) => {
  try {
    const { input } = request.body;
    const userId = request.user.id;

    const optimizedPrompt = await generateOptimizedPrompt(input);
    const relevantDocs = await performSemanticSearch(optimizedPrompt);
    const context = relevantDocs.join('\n');

    const memory = await ChatMessage.find({ sessionId: userId });

    const chain = new ConversationChain({
      memory,
      prompt: chatPrompt,
      llm: chat,
    });

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    let fullResponse = '';

    const handleLLMNewToken = async token => {
      fullResponse += token;
      reply.raw.write(`data: ${JSON.stringify({ token })}\n\n`);
    };

    await chain.call(
      {
        input: optimizedPrompt,
        context,
      },
      [handleLLMNewToken]
    );

    const summary = await summarizeText(fullResponse);
    const keywords = await extractKeywords(fullResponse);

    await Conversation.create({
      userId,
      message: input,
      response: fullResponse,
      summary,
      keywords,
    });

    reply.raw.write(`data: ${JSON.stringify({ summary, keywords })}\n\n`);
    reply.raw.write('data: [DONE]\n\n');
    reply.raw.end();
  } catch (error) {
    logger.error('Error in stream chat handler:', error);
    reply.raw.write(`data: ${JSON.stringify({ error: 'An error occurred while processing your request.' })}\n\n`);
    reply.raw.end();
  }
};

module.exports = {
  handleChat,
  getConversationHistory,
  streamChat,
};

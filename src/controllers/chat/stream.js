const { logger } = require('@/config/logging');
const { streamWithCompletion } = require('@/utils/ai/openAi/chat/streaming');
const { getEnv } = require('@/utils/api');
const { checkApiKey } = require('@/utils/auth');

// --- CHAT STREAM ---
const chatStream = async (req, res) => {
  logger.info(`REQUEST BODY: ${JSON.stringify(req.body)}`);
  const { sessionId, workspaceId, regenerate, prompt, userId, clientApiKey, role } = req.body;
  const initializationData = {
    apiKey: clientApiKey || process.env.OPENAI_API_PROJECT_KEY,
    pineconeIndex: getEnv('PINECONE_INDEX'),
    namespace: getEnv('PINECONE_NAMESPACE'),
    embeddingModel: getEnv('OPENAI_API_EMBEDDING_MODEL'),
    dimensions: parseInt(getEnv('EMBEDDING_MODEL_DIMENSIONS')),
    completionModel: getEnv('OPENAI_CHAT_COMPLETION_MODEL_2'),
    temperature: 0.5,
    maxTokens: 1024,
    topP: 1,
    frequencyPenalty: 0.5,
    presencePenalty: 0,
    prompt,
    providedWorkspaceId: workspaceId,
    providedSessionId: sessionId,
    userId,
    role,
    res,
  };

  try {
    checkApiKey(clientApiKey, 'OpenAI');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.flushHeaders();
    await streamWithCompletion(initializationData);
  } catch (error) {
    logger.error(`Error in chatStream: ${error}`);
    if (!res.headersSent) {
      res.status(500).json({ error: 'An error occurred while processing the chat stream' });
    }
  } finally {
    res.write('data: [DONE]\n\n');
    res.end();
  }
};

// --- EXPORT ---
module.exports = {
  chatStream,
};
// // --- RESPONSE HANDLER ---

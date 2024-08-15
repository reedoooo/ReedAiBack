const { logger } = require('@/config/logging');
const { streamWithCompletion } = require('@/utils/ai/openAi/chat/streaming');
const { getEnv } = require('@/utils/api');
const { checkApiKey } = require('@/utils/auth');

// --- CHAT STREAM ---
const chatStream = async (req, res) => {
  logger.info(`REQUEST BODY: ${JSON.stringify(req.body)}`);
  const { clientApiKey, userId, workspaceId, sessionId, prompt, role, regenerate, count } = req.body;
  const initializationData = {
    /* -- User and Data ID Values -- */
    apiKey: clientApiKey || process.env.OPENAI_API_PROJECT_KEY,
    providedUserId: userId,
    providedWorkspaceId: workspaceId,
    providedSessionId: sessionId,
    /* -- Provided Query -- */
    providedPrompt: regenerate ? null : prompt,
    providedRole: role,
    /* -- Default Chat Configs -- */
    sessionLength: count || 0,
    temperature: 0.5,
    maxTokens: 1024,
    topP: 1,
    frequencyPenalty: 0.5,
    presencePenalty: 0,
    /* -- Key Values for Accessing RAG Processing APIs -- */
    searchEngineKey: getEnv('GOOGLE_SERPER_API_KEY'),
    pineconeEnv: getEnv('PINECONE_ENVIRONMENT'),
    pineconeIndex: getEnv('PINECONE_INDEX'),
    namespace: getEnv('PINECONE_NAMESPACE'),
    dimensions: parseInt(getEnv('EMBEDDING_MODEL_DIMENSIONS')),
    embeddingModel: getEnv('OPENAI_API_EMBEDDING_MODEL'),
    completionModel: getEnv('OPENAI_CHAT_COMPLETION_MODEL_2'),
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

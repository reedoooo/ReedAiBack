const { default: OpenAI } = require('openai');
const { ChatSession, Message, User, Workspace } = require('@/models');
const { logger } = require('@/config/logging');
const { streamWithCompletion } = require('@/utils/ai/openAi/chat/streaming');
const { getEnv } = require('@/utils/api');
const { checkApiKey } = require('@/utils/auth');
const { saveMessagesToSession } = require('@/utils/ai/openAi/chat/initialize');
const { getMainSystemMessageContent } = require('@/lib/prompts/createPrompt');

const handleDatabaseOperation = async (operation, res, successStatus = 200, successMessage = null) => {
  try {
    const result = await operation();
    if (!result && successStatus !== 201) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.status(successStatus).json(successMessage || result);
  } catch (error) {
    res.status(500).json({ message: 'Database operation failed', error: error.message });
  }
};

const getAllSessions = (req, res) => handleDatabaseOperation(() => ChatSession.find(), res);

const getSessionById = (req, res) => {
  handleDatabaseOperation(
    () => ChatSession.findById(req.params.id).populate('messages').populate('files').populate('tools'),
    res
  );
};

const extractIdeasFromMessage = message => {
  try {
    const parsedMessage = JSON.parse(message);
    if (parsedMessage && parsedMessage.content) {
      return parsedMessage.content
        .split('\n')
        .filter(line => line.trim().match(/^(\d+\.|\-)\s*(.+)/))
        .map(line => line.trim().replace(/^(\d+\.|\-)\s*/, ''));
    }
  } catch (error) {
    return message
      .split('\n')
      .filter(line => line.trim().match(/^(\d+\.|\-)\s*(.+)/))
      .map(line => line.trim().replace(/^(\d+\.|\-)\s*/, ''));
  }
  return [];
};

const createSession = async (req, res) => {
  try {
    const { name, topic, prompt, userId, workspaceId, model, settings, apiKey } = req.body;
    const openai = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_PROJECT_KEY });
    const userPrompt =
      prompt || `Generate a list of helpful prompting ideas based on the topic: ${topic || 'New Chat Session'}`;
    const systemMessageContent = getMainSystemMessageContent();
    const systemMessage = { role: 'system', content: systemMessageContent };
    const userMessage = { role: 'user', content: userPrompt };

    const openaiResponse = await openai.chat.completions.create({
      model: settings.model || 'gpt-3.5-turbo',
      messages: [systemMessage, userMessage],
      max_tokens: settings.maxTokens || 500,
      temperature: settings.temperature || 0.7,
      response_format: { type: 'json_object' },
    });

    const initialMessage = openaiResponse.choices[0].message.content.trim();
    const ideas = extractIdeasFromMessage(initialMessage);
    const assistantMessage = { role: 'assistant', content: initialMessage };

    const newSessionData = {
      name: name || 'New Chat Session',
      topic: topic || 'New Chat Session',
      prompt: userPrompt,
      userId,
      workspaceId,
      summary: '',
      messages: [],
      ideas,
      model: model || 'gpt-3.5-turbo',
      active: true,
      settings: {
        contextCount: settings.contextCount || 15,
        maxTokens: settings.maxTokens || 500,
        temperature: settings.temperature || 0.7,
        model: settings.model || 'gpt-3.5-turbo',
        topP: settings.topP || 1,
        n: settings.n || 1,
        debug: settings.debug || false,
        summarizeMode: settings.summarizeMode || false,
      },
    };

    const newSession = new ChatSession(newSessionData);
    const savedSession = await newSession.save();

    const messagesToSave = [
      { ...systemMessage, userId, sessionId: savedSession._id, sequenceNumber: 0 },
      { ...userMessage, userId, sessionId: savedSession._id, sequenceNumber: 1 },
      { ...assistantMessage, userId, sessionId: savedSession._id, sequenceNumber: 2 },
    ].map(data => new Message(data));

    await Promise.all(messagesToSave.map(message => message.save()));
    savedSession.messages = messagesToSave.map(message => message._id);
    await savedSession.save();

    const activeWorkspace = await Workspace.findById(workspaceId);
    activeWorkspace.chatSessions.push(savedSession._id);
    await activeWorkspace.save();

    const user = await User.findById(userId);
    user.chatSessions.push(savedSession._id);
    await user.save();

    const populatedSession = await savedSession.populate('messages');
    logger.info(`populatedSession: ${JSON.stringify(populatedSession, null, 2)}`);
    res.status(201).json(populatedSession);
  } catch (error) {
    logger.error(`Error creating session: ${error.message}`);
    res.status(400).json({ message: 'Error creating session', error: error.message });
  }
};

const updateSession = (req, res) =>
  handleDatabaseOperation(() => ChatSession.findByIdAndUpdate(req.params.id, req.body, { new: true }), res);

const deleteSession = (req, res) =>
  handleDatabaseOperation(() => ChatSession.findByIdAndDelete(req.params.id), res, 200, {
    message: 'Session deleted successfully',
  });

const saveMessagesToChat = async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages must be an array' });
  }

  try {
    await saveMessagesToSession(req.params.id, messages);
    res.status(200).json({ message: 'Messages saved successfully', messages });
  } catch (error) {
    logger.error('Error saving messages:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const chatStream = async (req, res) => {
  logger.info(`REQUEST BODY: ${JSON.stringify(req.body)}`);
  const { clientApiKey, userId, workspaceId, sessionId, prompt, role, regenerate, count } = req.body;
  const initializationData = {
    apiKey: clientApiKey || process.env.OPENAI_API_PROJECT_KEY,
    providedUserId: userId,
    providedWorkspaceId: workspaceId,
    providedSessionId: sessionId,
    providedPrompt: regenerate ? null : prompt,
    providedRole: role,
    sessionLength: count || 0,
    temperature: 0.5,
    maxTokens: 1024,
    topP: 1,
    frequencyPenalty: 0.5,
    presencePenalty: 0,
    perplexityApiKey: getEnv('PERPLEXITY_API_KEY'),
    searchEngineKey: getEnv('GOOGLE_SERPER_API_KEY'),
    pineconeEnv: getEnv('PINECONE_ENVIRONMENT'),
    pineconeIndex: getEnv('PINECONE_INDEX'),
    namespace: getEnv('PINECONE_NAMESPACE'),
    dimensions: parseInt(getEnv('EMBEDDING_MODEL_DIMENSIONS')),
    embeddingModel: getEnv('OPENAI_API_EMBEDDING_MODEL'),
    completionModel: getEnv('OPENAI_CHAT_COMPLETION_MODEL'),
    res,
  };

  try {
    checkApiKey(clientApiKey, 'OpenAI');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // res.setHeader('Transfer-Encoding', 'chunked');
    // res.flushHeaders();
    await streamWithCompletion(initializationData);
  } catch (error) {
    logger.error(`Error in chatStream: ${error}`);
    if (!res.headersSent) {
      res.status(500).json({ error: 'An error occurred while processing the chat stream' });
    }
  }
  // finally {
  //   res.write('data: [DONE]\n\n');
  //   res.end();
  // }
};

module.exports = {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  saveMessagesToChat,
  chatStream,
};

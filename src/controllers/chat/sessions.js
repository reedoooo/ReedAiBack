const { default: OpenAI } = require('openai');
const { ChatSession: Session, Message, User, Workspace } = require('@/models');
const { saveMessagesToSession } = require('./helpers');
const { getMainSystemMessageContent } = require('@/lib/prompts/createPrompt');
const { logger } = require('@/config/logging');

const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find();
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sessions', error: error.message });
  }
};

const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('messages').populate('files').populate('tools');
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    const updatedSession = {
      ...session._doc,
      active: true,
    };

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching session', error: error.message });
  }
};
const initialConnectionCompletion = async (prompt, openai) => {
  const ideaGenerationFunction = {
    name: 'generate_ideas',
    description:
      "Generate a list of initial ideas or services based on the user's prompt or topic to help them achieve their goal.",
    parameters: {
      type: 'object',
      properties: {
        ideas: {
          type: 'array',
          items: {
            type: 'string',
            description: 'A potential idea or service suggestion',
          },
        },
      },
      required: ['ideas'],
    },
  };

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a creative assistant that generates ideas and suggestions based on user input.',
      },
      {
        role: 'user',
        content: `Provide a list of initial ideas or services to help a user achieve the following goal or prompt topic: "${prompt}"`,
      },
    ],
    functions: [ideaGenerationFunction],
    function_call: { name: 'generate_ideas' },
  });

  const functionCall = response.choices[0].message.function_call;
  if (functionCall && functionCall.name === 'generate_ideas') {
    const { ideas } = JSON.parse(functionCall.arguments);
    return ideas;
  }
  return [];
};
const extractIdeasFromMessage = message => {
  try {
    // Attempt to parse the message as JSON
    const parsedMessage = JSON.parse(message);

    // Check if the parsed message has a 'content' property
    if (parsedMessage && parsedMessage.content) {
      // Split the content by newlines and filter for lines starting with numbers or dashes
      const lines = parsedMessage.content.split('\n');
      const ideas = lines
        .filter(line => line.trim().match(/^(\d+\.|\-)\s*(.+)/))
        .map(line => line.trim().replace(/^(\d+\.|\-)\s*/, ''));

      return ideas;
    }
  } catch (error) {
    // If JSON parsing fails, fall back to simple string processing
    const lines = message.split('\n');
    const ideas = lines
      .filter(line => line.trim().match(/^(\d+\.|\-)\s*(.+)/))
      .map(line => line.trim().replace(/^(\d+\.|\-)\s*/, ''));

    return ideas;
  }

  // If no ideas are found, return an empty array
  return [];
};
const createSession = async (req, res) => {
  try {
    const { name, topic, prompt, userId, workspaceId, model, settings, apiKey } = req.body;

    const openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_PROJECT_KEY,
    });

    const userPrompt =
      prompt || `Generate a list of helpful prompting ideas based on the topic: ${topic || 'New Chat Session'}`;
    const systemMessageContent = getMainSystemMessageContent();
    const systemMessage = {
      role: 'system',
      content: systemMessageContent,
    };
    const userMessage = { role: 'user', content: userPrompt };
    let openaiResponse;
    try {
      openaiResponse = await openai.chat.completions.create({
        model: settings.model || 'gpt-3.5-turbo',
        messages: [systemMessage, userMessage],
        max_tokens: settings.maxTokens || 500,
        temperature: settings.temperature || 0.7,
        response_format: { type: 'json_object' },
        // top_p: settings.topP || 1,
        // n: settings.n || 1,
      });
    } catch (error) {
      throw new Error(`Error generating initial completion: ${error.message}`);
    }
    const initialMessage = openaiResponse.choices[0].message.content.trim();
    const ideas = extractIdeasFromMessage(initialMessage);
    const assistantMessage = { role: 'assistant', content: initialMessage };
    let savedSession;
    try {
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

      const newSession = new Session(newSessionData);
      savedSession = await newSession.save();
    } catch (error) {
      throw new Error(`Error creating session: ${error.message}`);
    }
    // Save messages to the session
    const newSystemMessage = new Message({
      ...systemMessage,
      userId: userId,
      sessionId: savedSession._id,
      content: systemMessage.content,
      role: 'system',
      sequenceNumber: 0,
    });
    const newUserMessage = new Message({
      ...userMessage,
      userId: userId,
      sessionId: savedSession._id,
      content: userPrompt,
      role: 'user',
      sequenceNumber: 1,
    });
    const newAssistantMessage = new Message({
      ...assistantMessage,
      userId: userId,
      sessionId: savedSession._id,
      content: initialMessage,
      role: 'assistant',
      sequenceNumber: 2,
    });
    await newSystemMessage.save();
    await newUserMessage.save();
    await newAssistantMessage.save();
    savedSession.messages = [newSystemMessage._id, newUserMessage._id, newAssistantMessage._id];
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
const updateSession = async (req, res) => {
  try {
    const updatedSession = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedSession) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.status(200).json(updatedSession);
  } catch (error) {
    res.status(400).json({ message: 'Error updating session', error: error.message });
  }
};

const deleteSession = async (req, res) => {
  try {
    const deletedSession = await Session.findByIdAndDelete(req.params.id);
    if (!deletedSession) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting session', error: error.message });
  }
};

const saveMessagesToChat = async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages must be an array' });
  }

  try {
    await saveMessagesToSession(req.params.id, messages);
    res.status(200).json({ message: 'Messages saved successfully', messages });
  } catch (error) {
    console.error('Error saving messages:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  saveMessagesToChat,
};

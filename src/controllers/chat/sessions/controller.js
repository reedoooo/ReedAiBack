const logger = require('../../../config/logging');
const { ChatSession, UserActiveChatSession, Message } = require('../../../models');
const { saveMessagesToSession } = require('./helpers');
const initiateChatSession = async (req, res) => {
  try {
    const { workspaceId, userId, message } = req.body;

    // Check for active chat session
    let chatSession = await ChatSession.findOne({ workspace: workspaceId, active: true });

    if (!chatSession) {
      chatSession = new ChatSession({
        workspace: workspaceId,
        title: 'New Chat Session',
        participants: [userId],
        messages: [],
      });
      await chatSession.save();
    }

    // Add new message to chat session
    const newMessage = {
      sender: userId,
      content: message,
      timestamp: new Date(),
    };
    chatSession.messages.push(newMessage);
    await chatSession.save();

    // Add message to Pinecone
    await pineconeService.addMessageToPinecone(chatSession._id, newMessage);

    // Get chat completion from OpenAI
    const completion = await openaiService.getChatCompletion(chatSession.messages);

    // Add completion to chat session
    const completionMessage = {
      sender: 'bot',
      content: completion,
      timestamp: new Date(),
    };
    chatSession.messages.push(completionMessage);
    await chatSession.save();

    // Return chat session with populated data
    await chatSession.populate('participants').execPopulate();
    res.json(chatSession);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};
// UserActiveChatSession Controllers
const listUserActiveChatSessions = async (req, res) => {
  try {
    const sessions = await UserActiveChatSession.find().sort('_id');
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserActiveChatSession = async (req, res) => {
  try {
    const session = await UserActiveChatSession.findOne({ userId: req.params.userId });
    if (session) {
      res.json(session);
    } else {
      res.status(404).json({ message: 'Session not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createUserActiveChatSession = async (req, res) => {
  const session = new UserActiveChatSession({
    userId: req.body.userId,
    chatSessionId: req.body.chatSessionId,
  });

  try {
    const newSession = await session.save();
    res.status(201).json(newSession);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateUserActiveChatSession = async (req, res) => {
  try {
    const updatedSession = await UserActiveChatSession.findOneAndUpdate(
      { userId: req.params.userId },
      {
        chatSessionId: req.body.chatSessionId,
        updatedAt: new Date(),
      },
      { new: true }
    );
    res.json(updatedSession);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteUserActiveChatSession = async (req, res) => {
  try {
    await UserActiveChatSession.deleteOne({ userId: req.params.userId });
    res.json({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createOrUpdateUserActiveChatSession = async (req, res) => {
  try {
    const session = await UserActiveChatSession.findOneAndUpdate(
      { userId: req.body.userId },
      {
        chatSessionId: req.body.chatSessionId,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    res.json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ChatSession Controllers
const getAllChatSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ active: true }).sort('_id');
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChatSessionByIDWithInActive = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ id: req.params.id }).sort('updatedAt');
    if (session) {
      res.json(session);
    } else {
      res.status(404).json({ message: 'Session not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChatSessionDefault = async (req, res) => {
  try {
    const { userId, workspaceId, assistantId } = req.query;
    const defaultModel = await ChatModel.findOne({ isDefault: true });
    const newId = new Types.ObjectId(); // Generate ObjectId
    const defaultSession = {
      name: 'Default Chat Session',
      topic: 'Default Chat Session',
      userId: userId,
      workspaceId: workspaceId,
      assistantId: assistantId,
      model: defaultModel._id,
      prompt: defaultModel.prompt,
      active: true,
      activeSessionId: newId,
      settings: {
        maxTokens: 500, // max length of the completion
        temperature: 0.7,
        model: 'gpt-4-turbo-preview',
        topP: 1,
        n: 4,
        debug: false,
        summarizeMode: false,
      },
      messages: [],
      stats: {
        tokenUsage: 0,
        messageCount: 0,
      },
      tuning: {
        debug: false,
        summary: '',
        summarizeMode: false,
      },
    };
    res.json(defaultSession);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

const getChatSessionsByUser = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user.id });
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

const deleteChatSession = async (req, res) => {
  try {
    const session = await ChatSession.findByIdAndDelete(req.params.id);
    if (!session) {
      return res.status(404).send('Chat session not found');
    }
    res.json({ msg: 'Chat session deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

const createChatSession = async (req, res) => {
  try {
    const { sessionId, topic, model } = req.body;
    const newSession = new ChatSession({
      name: 'New Chat Session',
      topic,
      userId: req.user.id,
      workspaceId: req.body.workspaceId,
      assistantId: req.body.assistantId,
      model,
      activeSessionId: sessionId,
    });
    const session = await newSession.save();
    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

const renameChatSession = async (req, res) => {
  try {
    const session = await ChatSession.findByIdAndUpdate(req.params.id, { topic: req.body.topic }, { new: true });
    if (!session) {
      return res.status(404).send('Chat session not found');
    }
    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

const clearSessionChatMessages = async (req, res) => {
  try {
    const session = await ChatSession.findById(req.params.id);
    if (!session) {
      return res.status(404).send('Chat session not found');
    }
    session.messages = [];
    await session.save();
    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

const updateChatSession = async (req, res) => {
  try {
    const session = await ChatSession.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!session) {
      return res.status(404).send('Chat session not found');
    }
    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

// --- NEW ---
const getChatSessionBySessionId = async (req, res) => {
  try {
    const { sessionId } = req.body;
    logger.info(`Get chat session by sessionId: ${sessionId}`);
    const session = await ChatSession.findById(sessionId).populate('participants').populate('messages');
    if (session) {
      res.status(200).json(session);
    } else {
      res.status(404).json({ message: 'Session not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getChatSessionMessagesBySessionId = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await ChatSession.findById(sessionId).populate('participants').populate('messages');
    if (session) {
      res.json(session.messages);
    } else {
      res.status(404).json({ message: 'Session not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const saveMessagesToChat = async (req, res) => {
  const { sessionId, messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages must be an array' });
  }

  try {
    await saveMessagesToSession(sessionId, messages);
    res.status(200).json({ message: 'Messages saved successfully' });
  } catch (error) {
    console.error('Error saving messages:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  // --- primary ---
  initiateChatSession,
  // --- important ---
  listUserActiveChatSessions,
  getUserActiveChatSession,
  getAllChatSessions,
  createChatSession,
  createUserActiveChatSession,
  updateChatSession,
  getChatSessionBySessionId,
  getChatSessionMessagesBySessionId,
  // --- secondary ---
  updateUserActiveChatSession,
  deleteUserActiveChatSession,
  createOrUpdateUserActiveChatSession,
  deleteChatSession,
  getChatSessionByIDWithInActive,
  // --- custom ---
  getChatSessionDefault,
  getChatSessionsByUser,
  renameChatSession,
  clearSessionChatMessages,
  saveMessagesToChat,
};

// const createChatSessionByID = async (req, res) => {
//   const session = new ChatSession({
//     userId: req.body.userId,
//     id: req.body.id,
//     topic: req.body.topic,
//     createdAt: req.body.createdAt,
//     active: req.body.active,
//     maxLength: req.body.maxLength,
//     model: req.body.model,
//   });

//   try {
//     const newSession = await session.save();
//     res.status(201).json(newSession);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// const updateChatSessionByID = async (req, res) => {
//   try {
//     const updatedSession = await ChatSession.findOneAndUpdate(
//       { id: req.params.id },
//       {
//         userId: req.body.userId,
//         topic: req.body.topic,
//         updatedAt: new Date(),
//       },
//       { new: true }
//     );
//     res.json(updatedSession);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// const createOrUpdateChatSessionByID = async (req, res) => {
//   try {
//     const session = await ChatSession.findOneAndUpdate(
//       { id: req.body.id },
//       {
//         userId: req.body.userId,
//         topic: req.body.topic,
//         maxLength: req.body.maxLength,
//         temperature: req.body.temperature,
//         model: req.body.model,
//         maxTokens: req.body.maxTokens,
//         topP: req.body.topP,
//         n: req.body.n,
//         debug: req.body.debug,
//         summarizeMode: req.body.summarizeMode,
//         updatedAt: new Date(),
//       },
//       { upsert: true, new: true }
//     );
//     res.json(session);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// const updateChatSessionTopicByID = async (req, res) => {
//   try {
//     const updatedSession = await ChatSession.findOneAndUpdate(
//       { id: req.body.id },
//       {
//         topic: req.body.topic,
//         updatedAt: new Date(),
//       },
//       { new: true, upsert: true }
//     );
//     res.json(updatedSession);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// const deleteChatSessionByID = async (req, res) => {
//   try {
//     const updatedSession = await ChatSession.findOneAndUpdate({ id: req.params.id }, { active: false }, { new: true });
//     res.json(updatedSession);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// const getChatSessionsByUserID = async (req, res) => {
//   try {
//     const sessions = await ChatSession.find({ userId: req.params.userId, active: true }).sort('_id');
//     res.json(sessions);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// const hasChatSessionPermission = async (req, res) => {
//   try {
//     const session = await ChatSession.findOne({ _id: req.params.id });
//     if (session && (session.userId === req.params.userId || req.user.isSuperuser)) {
//       res.json({ hasPermission: true });
//     } else {
//       res.json({ hasPermission: false });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// const updateSessionMaxLength = async (req, res) => {
//   try {
//     const updatedSession = await ChatSession.findOneAndUpdate(
//       { id: req.params.id },
//       {
//         maxLength: req.body.maxLength,
//         updatedAt: new Date(),
//       },
//       { new: true }
//     );
//     res.json(updatedSession);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

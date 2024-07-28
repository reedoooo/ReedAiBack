// const { logger } = require('../../../config');
// const { ChatSession, Chat, Workspace } = require('../../../models');
// const { v4: uuidv4, parse: uuidParse } = require('uuid');
// /**
//  * Creates a new chat session.
//  *
//  * @param {Object} sessionParams - chatId, userId, workspaceId
//  * @returns {Promise<ChatSession>} The newly created chat session.
//  * @throws {Error} If there was an error creating the session.
//  */
// async function createChatSession(sessionParams) {
//   try {
// 		const newSessionId = uuidv4();
// 		const newSession = await ChatSession.create({
// 		  uuid: newSessionId,
//       chatId: sessionParams.chatId,
//       userId: sessionParams.userId,
//     });

// 		await Workspace.findByIdAndUpdate(chatId, {
// 			$push: { chatSessions: newChatSession._id },
// 			sessionId: newSession.sessionId,
// 		});
//     await newSession.save();
// 		return newSession;
//   } catch (err) {
// 		logger.error(`Failed to create session: ${err.message}`);
//     throw new Error('Failed to create session: ' + err.message);
//   }
// }
// async function createChatSessionById(sessionParams) {
//   try {
//     const session = new ChatSession(sessionParams);
//     await session.save();
//     return session;
//   } catch (err) {
//     throw new Error('Failed to create session: ' + err.message);
//   }
// }

// async function getChatSessionById(id) {
//   try {
//     const session = await ChatSession.findById(id).populate('messages');
//     if (!session) throw new Error('Session not found');
//     return session;
//   } catch (err) {
//     throw new Error('Failed to get session: ' + err.message);
//   }
// }

// async function updateChatSession(id, sessionParams) {
//   try {
//     const session = await ChatSession.findByIdAndUpdate(id, sessionParams, { new: true }).populate('messages');
//     if (!session) throw new Error('Session not found');
//     return session;
//   } catch (err) {
//     throw new Error('Failed to update session: ' + err.message);
//   }
// }

// async function deleteChatSession(id) {
//   try {
//     await ChatSession.findByIdAndDelete(id).populate('messages');
//   } catch (err) {
//     throw new Error('Failed to delete session: ' + err.message);
//   }
// }

// async function getAllChatSessions() {
//   try {
//     const sessions = await ChatSession.find().populate('messages');
//     return sessions;
//   } catch (err) {
//     throw new Error('Failed to retrieve sessions: ' + err.message);
//   }
// }

// async function getChatSessionById(uuid) {
//   try {
//     const session = await ChatSession.findOne({ uuid }).populate('messages');
//     if (!session) throw new Error('Session not found');
//     return session;
//   } catch (err) {
//     throw new Error('Failed to retrieve session: ' + err.message);
//   }
// }

// async function updateChatSessionById(uuid, sessionParams) {
//   try {
//     const session = await ChatSession.findOneAndUpdate({ uuid }, sessionParams, { new: true }).populate('messages');
//     if (!session) throw new Error('Session not found');
//     return session;
//   } catch (err) {
//     throw new Error('Failed to update session: ' + err.message);
//   }
// }

// async function deleteChatSessionById(uuid) {
//   try {
//     await ChatSession.findOneAndDelete({ uuid });
//   } catch (err) {
//     throw new Error('Failed to delete session: ' + err.message);
//   }
// }

// async function getChatSessionsByUserID(userID) {
//   try {
//     const sessions = await ChatSession.find({ userID }).populate('messages');
//     return sessions;
//   } catch (err) {
//     throw new Error('Failed to retrieve sessions: ' + err.message);
//   }
// }
// async function createUserActiveChatSession(sessionParams) {
//   try {
//     const session = new UserActiveChatSession(sessionParams).populate('messages');
//     await session.save();
//     return session;
//   } catch (err) {
//     throw new Error('Failed to create active session: ' + err.message);
//   }
// }

// async function createOrUpdateUserActiveChatSession(params) {
//   try {
//     const session = await UserActiveChatSession.findOneAndUpdate({ userID: params.userID }, params, {
//       new: true,
//       upsert: true,
//     }).populate('messages');
//     return session;
//   } catch (err) {
//     throw new Error('Failed to update or create active session: ' + err.message);
//   }
// }

// async function getUserActiveChatSession(userID) {
//   try {
//     const session = await UserActiveChatSession.findOne({ userID }).populate('messages');
//     if (!session) throw new Error('Session not found');
//     return session;
//   } catch (err) {
//     throw new Error('Failed to get active session: ' + err.message);
//   }
// }

// async function updateUserActiveChatSession(userID, sessionUuid) {
//   try {
//     const session = await UserActiveChatSession.findOneAndUpdate({ userID }, { sessionUuid }, { new: true }).populate('messages');
//     if (!session) throw new Error('Session not found');
//     return session;
//   } catch (err) {
//     throw new Error('Failed to update active session: ' + err.message);
//   }
// }

// async function deleteUserActiveChatSession(userID) {
//   try {
//     await UserActiveChatSession.findOneAndDelete({ userID });
//   } catch (err) {
//     throw new Error('Failed to delete active session: ' + err.message);
//   }
// }

// /**
//  * Retrieves simple chat sessions by user ID.
//  *
//  * @param {string} userID - The ID of the user.
//  * @returns {Promise<Array<Object>>} - A promise that resolves to an array of simple chat sessions.
//  * @throws {Error} - If there is an error retrieving the sessions.
//  */
// async function getSimpleChatSessionsByUserID(userId) {
//   try {
//     const sessions = await ChatSession.find({ userId });
//     return sessions.map(session => ({
//       uuid: session.uuid,
//       isEdit: false,
//       title: session.topic,
//       maxLength: session.maxLength,
//       temperature: session.temperature,
//       topP: session.topP,
//       n: session.n,
//       maxTokens: session.maxTokens,
//       debug: session.debug,
//       model: session.model,
//       summarizeMode: session.summarizeMode,
//     })).populate('messages');
//   } catch (err) {
//     throw new Error('Failed to retrieve sessions: ' + err.message);
//   }
// }
const { logger } = require('../../../config');
const { ChatSession, Chat, Workspace } = require('../../../models');
const { v4: uuidv4 } = require('uuid');

async function createChatSession(sessionParams) {
  try {
    const newSessionId = uuidv4();
    const newSession = await ChatSession.create({
      sessionId: newSessionId,
      chatId: sessionParams.chatId,
      userId: sessionParams.userId,
    });

    await Chat.findByIdAndUpdate(sessionParams.chatId, {
      $push: { chatSessions: newSession._id },
      sessionId: newSession.sessionId,
    });

    return newSession;
  } catch (err) {
    logger.error(`Failed to create session: ${err.message}`);
    throw new Error('Failed to create session: ' + err.message);
  }
}

async function getChatSessionById(id) {
  try {
    const session = await ChatSession.findById(id).populate('messageHistory');
    if (!session) throw new Error('Session not found');
    return session;
  } catch (err) {
    throw new Error('Failed to get session: ' + err.message);
  }
}

async function updateChatSession(id, sessionParams) {
  try {
    const session = await ChatSession.findByIdAndUpdate(id, sessionParams, { new: true });
    if (!session) throw new Error('Session not found');
    return session;
  } catch (err) {
    throw new Error('Failed to update session: ' + err.message);
  }
}

async function deleteChatSession(id) {
  try {
    await ChatSession.findByIdAndDelete(id);
  } catch (err) {
    throw new Error('Failed to delete session: ' + err.message);
  }
}

async function getAllChatSessions() {
  try {
    const sessions = await ChatSession.find();
    return sessions;
  } catch (err) {
    throw new Error('Failed to retrieve sessions: ' + err.message);
  }
}

async function getChatSessionById(uuid) {
  try {
    const session = await ChatSession.findOne({ sessionId: uuid }).populate('messageHistory');
    if (!session) throw new Error('Session not found');
    return session;
  } catch (err) {
    throw new Error('Failed to retrieve session: ' + err.message);
  }
}

async function updateChatSessionById(uuid, sessionParams) {
  try {
    const session = await ChatSession.findOneAndUpdate({ sessionId: uuid }, sessionParams, { new: true });
    if (!session) throw new Error('Session not found');
    return session;
  } catch (err) {
    throw new Error('Failed to update session: ' + err.message);
  }
}

async function deleteChatSessionById(uuid) {
  try {
    await ChatSession.findOneAndDelete({ sessionId: uuid });
  } catch (err) {
    throw new Error('Failed to delete session: ' + err.message);
  }
}

async function getChatSessionsByUserID(userId) {
  try {
    const sessions = await ChatSession.find({ userId });
    return sessions;
  } catch (err) {
    throw new Error('Failed to retrieve sessions: ' + err.message);
  }
}

async function getSimpleChatSessionsByUserID(userId) {
  try {
    const sessions = await ChatSession.find({ userId });
    return sessions.map(session => ({
      sessionId: session.sessionId,
      tokenUsage: session.tokenUsage,
      messageHistory: session.messageHistory,
    }));
  } catch (err) {
    throw new Error('Failed to retrieve sessions: ' + err.message);
  }
}

/**
 * Creates a new chat session and sets it as the active session.
 *
 * @param {Object} sessionParams - chatId, userId, workspaceId
 * @returns {Promise<ChatSession>} The newly created chat session.
 * @throws {Error} If there was an error creating the session.
 */
async function createActiveChatSession(sessionParams) {
  try {
    const newSessionId = uuidv4();
    const newSession = await ChatSession.create({
      sessionId: newSessionId,
      chatId: sessionParams.chatId,
      userId: sessionParams.userId,
    });

    await Chat.findByIdAndUpdate(sessionParams.chatId, {
      activeSessionId: newSession._id,
      $push: { chatSessions: newSession._id },
    });

    return newSession;
  } catch (err) {
    logger.error(`Failed to create active session: ${err.message}`);
    throw new Error('Failed to create active session: ' + err.message);
  }
}

/**
 * Updates the active chat session for a chat.
 *
 * @param {String} chatId - The ID of the chat.
 * @param {Object} sessionParams - Parameters to update the session.
 * @returns {Promise<ChatSession>} The updated chat session.
 * @throws {Error} If there was an error updating the session.
 */
async function updateActiveChatSession(chatId, sessionParams) {
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error('Chat not found');

    const session = await ChatSession.findByIdAndUpdate(chat.activeSessionId, sessionParams, { new: true });
    if (!session) throw new Error('Session not found');

    return session;
  } catch (err) {
    logger.error(`Failed to update active session: ${err.message}`);
    throw new Error('Failed to update active session: ' + err.message);
  }
}

/**
 * Retrieves the active chat session for a chat.
 *
 * @param {String} chatId - The ID of the chat.
 * @returns {Promise<ChatSession>} The active chat session.
 * @throws {Error} If there was an error retrieving the session.
 */
async function getActiveChatSession(chatId) {
  try {
    const chat = await Chat.findById(chatId).populate('activeSessionId');
    if (!chat) throw new Error('Chat not found');

    return chat.activeSessionId;
  } catch (err) {
    logger.error(`Failed to get active session: ${err.message}`);
    throw new Error('Failed to get active session: ' + err.message);
  }
}

module.exports = {
  createChatSession,
  getChatSessionById,
  updateChatSession,
  deleteChatSession,
  getAllChatSessions,
  getChatSessionById,
  updateChatSessionById,
  deleteChatSessionById,
  getChatSessionsByUserID,
  getSimpleChatSessionsByUserID,
  createActiveChatSession,
  updateActiveChatSession,
  getActiveChatSession,
  // createUserActiveChatSession,
  // createOrUpdateUserActiveChatSession,
  // getUserActiveChatSession,
  // updateUserActiveChatSession,
  // deleteUserActiveChatSession,
};

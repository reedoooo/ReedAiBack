const { ChatSession: Session } = require('../../models');
const { saveMessagesToSession } = require('./helpers');

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

const createSession = async (req, res) => {
  try {
    const newSession = new Session(req.body);
    const savedSession = await newSession.save();
    res.status(201).json(savedSession);
  } catch (error) {
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
    res.status(200).json({ message: 'Messages saved successfully' });
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

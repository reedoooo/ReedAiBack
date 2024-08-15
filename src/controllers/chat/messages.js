const { Message: ChatMessage, ChatSession, Workspace, User } = require('@/models');

const getMessagesByChatSessionId = async (req, res) => {
  try {
    const chatMessages = await ChatMessage.find({ sessionId: req.params.sessionId });

    res.status(200).json(chatMessages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat messages', error: error.message });
  }
};
const getMessageById = async (req, res) => {
  try {
    const chatMessage = await ChatMessage.findById(req.params.id);
    if (!chatMessage) return res.status(404).json({ message: 'Message not found' });

    res.status(200).json(chatMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat message', error: error.message });
  }
};
const createMessage = async (req, res) => {
  try {
    const { content, role, userId, sessionId } = req.body;
    const message = new ChatMessage({ content, role, userId, sessionId });

    await message.save();

    // Update related models
    await ChatSession.findByIdAndUpdate(sessionId, { $push: { messages: message._id } });
    await Workspace.updateMany({ chatSessions: sessionId }, { $push: { messages: message._id } });
    await User.findByIdAndUpdate(userId, { $push: { messages: message._id } });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error creating chat message', error: error.message });
  }
};
const createMessages = async (req, res) => {
  try {
    const messages = req.body.messages;
    const savedMessages = await ChatMessage.insertMany(messages);

    // Update related models
    for (const message of savedMessages) {
      await ChatSession.findByIdAndUpdate(message.sessionId, { $push: { messages: message._id } });
      await Workspace.updateMany({ chatSessions: message.sessionId }, { $push: { messages: message._id } });
      await User.findByIdAndUpdate(message.userId, { $push: { messages: message._id } });
    }

    res.status(201).json(savedMessages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const updateMessage = async (req, res) => {
  try {
    const message = await ChatMessage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error updating chat message', error: error.message });
  }
};
const deleteMessage = async (req, res) => {
  try {
    const message = await ChatMessage.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Remove message references from related models
    await ChatSession.updateMany({}, { $pull: { messages: message._id } });
    await Workspace.updateMany({}, { $pull: { messages: message._id } });
    await User.updateMany({}, { $pull: { messages: message._id } });

    res.status(200).json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Delete messages including and after a certain sequence number
const deleteMessagesIncludingAndAfter = async (req, res) => {
  try {
    const { userId, sessionId, sequenceNumber } = req.body;
    const messages = await ChatMessage.deleteMany({ sessionId, sequenceNumber: { $gte: sequenceNumber } });

    // Remove message references from related models
    await ChatSession.updateMany({}, { $pull: { messages: { $in: messages.map(m => m._id) } } });
    await Workspace.updateMany({}, { $pull: { messages: { $in: messages.map(m => m._id) } } });
    await User.updateMany({}, { $pull: { messages: { $in: messages.map(m => m._id) } } });

    res.status(200).json({ message: `Deleted ${messages.deletedCount} messages` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = {
  getMessagesByChatSessionId,
  getMessageById,
  createMessage,
  createMessages,
  updateMessage,
  deleteMessage,
  deleteMessagesIncludingAndAfter,
};

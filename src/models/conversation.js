// models/conversation.js

const { default: mongoose } = require("mongoose");

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  response: { type: String, required: true },
  summary: { type: String },
  keywords: { type: [String] },
  entities: { type: [String] },
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
// models/conversation.js

module.exports = {
	Conversation,
};
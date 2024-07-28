const openai = require('../config/openai');

exports.getChatCompletion = async (messages) => {
  const formattedMessages = messages?.map(msg => ({
    role: msg.sender === 'bot' ? 'assistant' : 'user',
    content: msg.content,
  }));

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: formattedMessages,
  });

  return response.choices[0].message.content;
};
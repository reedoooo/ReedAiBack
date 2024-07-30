const { ChatSession, Model, Prompt } = require('../../../models');
const {
  getAskMessages,
  createChatPromptSimple,
  createChatMessageSimple,
  updateChatMessageContent,
  logChat,
} = require('./service');

async function openAIChatCompletionAPIWithStreamHandler(req, res) {
  const { prompt, sessionUuid, chatUuid, regenerate, options } = req.body;
  const newQuestion = prompt;
  const ctx = req.context;
  const userID = req.user.id; // Assuming userID is set in the request object

  if (regenerate) {
    await regenerateAnswer(res, sessionUuid, chatUuid);
  } else {
    await genAnswer(res, sessionUuid, chatUuid, newQuestion, userID);
  }
}

async function genAnswer(res, sessionUuid, chatUuid, newQuestion, userID) {
  const chatSession = await ChatSession.findOne({ uuid: sessionUuid });
  if (!chatSession) {
    return res.status(500).json({ error: 'Failed to get session' });
  }

  const chatModel = await Model.findOne({ name: chatSession.model }); // Implement ChatModel schema
  if (!chatModel) {
    return res.status(500).json({ error: 'Failed to get model' });
  }

  const baseURL = chatModel.url;
  const existingPrompt = await Prompt.findOne({ sessionUuid });

  if (existingPrompt) {
    await createChatMessageSimple(
      sessionUuid,
      chatUuid,
      'user',
      newQuestion,
      userID,
      baseURL,
      chatSession.summarizeMode
    );
  } else {
    await createChatPromptSimple(sessionUuid, newQuestion, userID);
  }

  const msgs = await getAskMessages(chatSession, chatUuid, false);
  const totalTokens = msgs.reduce((sum, msg) => sum + msg.tokenCount, 0);

  if (totalTokens > (chatSession.maxTokens * 2) / 3) {
    return res.status(413).json({ error: 'Token length exceed limit', maxTokens: chatSession.maxTokens, totalTokens });
  }

  const chatStreamFn = chooseChatStreamFn(chatSession, msgs);
  const [answerText, answerID, shouldReturn] = await chatStreamFn(res, chatSession, msgs, chatUuid, false);

  if (shouldReturn) return;
  await createChatMessageSimple(
    sessionUuid,
    answerID,
    'assistant',
    answerText,
    userID,
    baseURL,
    chatSession.summarizeMode
  );
}

async function regenerateAnswer(res, sessionUuid, chatUuid) {
  const chatSession = await ChatSession.findOne({ uuid: sessionUuid });
  if (!chatSession) {
    return res.status(500).json({ error: 'Failed to get chat session' });
  }

  const msgs = await getAskMessages(chatSession, chatUuid, true);
  const totalTokens = msgs.reduce((sum, msg) => sum + msg.tokenCount, 0);

  if (totalTokens > (chatSession.maxTokens * 2) / 3) {
    return res.status(413).json({ error: 'Token length exceed limit', maxTokens: chatSession.maxTokens, totalTokens });
  }

  const chatStreamFn = chooseChatStreamFn(chatSession, msgs);
  const [answerText] = await chatStreamFn(res, chatSession, msgs, chatUuid, true);

  await updateChatMessageContent(chatUuid, answerText);
}

function chooseChatStreamFn(chatSession, msgs) {
  const model = chatSession.model;
  const isTestChat = isTest(msgs);
  const isChatGPT =
    model.startsWith('gpt') || model.startsWith('deepseek') || model.startsWith('yi') || model.startsWith('qwen');

  if (isTestChat) return chatStreamTest;
  if (isChatGPT) return chatStream;
  return customChatStream;
}

function isTest(msgs) {
  const lastMsg = msgs[msgs.length - 1];
  const promptMsg = msgs[0];
  return promptMsg.content === 'test_demo_bestqa' || lastMsg.content === 'test_demo_bestqa';
}

module.exports = {
  openAIChatCompletionAPIWithStreamHandler,
};

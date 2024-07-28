const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
// const {
//   getChatSessionByUuid,
//   getChatModelByName,
//   getChatPromptBySessionUuid,
//   createChatPrompt,
//   createChatMessage,
//   updateChatMessage,
//   getChatMessages,
//   logChat,
// } = require('./service');
const { RespondWithError, genOpenAIConfig, getUserId } = require('../../../utils');
const {
  getChatSessionByUuid,
  getChatModelByName,
  getChatPromptBySessionUuid,
  createChatMessage,
  createChatPrompt,
  getChatMessages,
} = require('./service');

const chatStreamHandler = async (req, res) => {
  const { prompt, sessionUuid, chatUuid, regenerate, options } = req.body;
  console.log(`sessionUuid: ${sessionUuid}`);
  console.log(`chatUuid: ${chatUuid}`);
  console.log(`newQuestion: ${prompt}`);

  const userID = await getUserId(req, res);

  if (regenerate) {
    regenerateAnswer(res, sessionUuid, chatUuid);
  } else {
    genAnswer(res, sessionUuid, chatUuid, prompt, userID);
  }
};

const genAnswer = async (res, sessionUuid, chatUuid, newQuestion, userId) => {
  try {
    const chatSession = await getChatSessionByUuid(sessionUuid);
    if (!chatSession) throw new Error('Session not found');

    const chatModel = await getChatModelByName(chatSession.model);
    if (!chatModel) throw new Error('Model not found');

    const baseURL = chatModel.baseUrl;
    let existingPrompt = true;

    const chatPrompt = await getChatPromptBySessionUuid(sessionUuid);
    if (!chatPrompt) existingPrompt = false;

    if (existingPrompt) {
      await createChatMessage({
        sessionUuid: chatSession.uuid,
        chatUuid,
        role: 'user',
        content: newQuestion,
        userId,
        baseURL,
        summarizeMode: chatSession.summarizeMode,
      });
    } else {
      const newChatPrompt = {
        sessionUuid: sessionUuid,
        content: newQuestion,
        userId,
      };
      await createChatPrompt(newChatPrompt);
      console.log(newChatPrompt);
    }

    const msgs = await getChatMessages(chatSession, chatUuid, false);

    const totalTokens = msgs.reduce((sum, msg) => sum + msg.tokenCount, 0);

    if (totalTokens > (chatSession.maxTokens * 2) / 3) {
      return RespondWithError(res, 413, 'Token length exceeds limit', {
        maxTokens: chatSession.maxTokens,
        totalTokens: totalTokens,
      });
    }

    const chatStreamFn = chooseChatStreamFn(chatSession, msgs);
    const { answerText, answerID, shouldReturn } = await chatStreamFn(res, chatSession, msgs, chatUuid, false);

    if (shouldReturn) return;

    await logChat(chatSession, msgs, answerText);

    await createChatMessage({
      sessionUuid: sessionUuid,
      chatUuid: answerID,
      role: 'assistant',
      content: answerText,
      userId: userId,
      baseURL,
      summarizeMode: chatSession.summarizeMode,
    });
  } catch (err) {
    RespondWithError(res, 500, 'Error processing request', err);
  }
};

const regenerateAnswer = async (res, sessionUuid, chatUuid) => {
  try {
    const db = res.app.locals.db;
    const chatSession = await db.collection('chat_sessions').findOne({ uuid: sessionUuid });
    if (!chatSession) throw new Error('Session not found');

    const msgs = await getAskMessages(chatSession, chatUuid, true);

    const totalTokens = msgs.reduce((sum, msg) => sum + msg.tokenCount, 0);

    if (totalTokens > (chatSession.maxTokens * 2) / 3) {
      return RespondWithError(res, 413, 'Token length exceeds limit', {
        max_tokens: chatSession.maxTokens,
        total_tokens: totalTokens,
      });
    }

    const chatStreamFn = chooseChatStreamFn(chatSession, msgs);
    const { answerText, shouldReturn } = await chatStreamFn(res, chatSession, msgs, chatUuid, true);

    if (shouldReturn) return;

    await logChat(chatSession, msgs, answerText);

    await db
      .collection('chat_messages')
      .updateOne({ uuid: chatUuid }, { $set: { content: answerText, updatedAt: new Date() } });
  } catch (err) {
    RespondWithError(res, 500, 'Error processing request', err);
  }
};

const chooseChatStreamFn = (chatSession, msgs) => {
  const model = chatSession.model;
  const isTestChat = isTest(msgs);
  const isChatGPT = model.startsWith('gpt');

  if (isTestChat) return chatStreamTest;
  if (isChatGPT) return chatStream;
  return customChatStream;
};

const chatStream = async (res, chatSession, chatMessages, chatUuid, regenerate) => {
  try {
    // Obtain the API token (implement rate limiter if necessary)
    const openAIRateLimiter = {}; // Placeholder for rate limiter
    openAIRateLimiter.Wait(context.Background());

    const exceedPerModeRateLimitOrError = await CheckModelAccess(
      res,
      chatSession.uuid,
      chatSession.model,
      chatSession.userId
    );
    if (exceedPerModeRateLimitOrError) return;

    const db = res.app.locals.db;
    const chatModel = await db.collection('chat_models').findOne({ name: chatSession.model });
    if (!chatModel) throw new Error('Model not found');

    const config = genOpenAIConfig(chatModel);

    const client = new openai.Client(config);

    const chatFiles = await db.collection('chat_files').find({ sessionUuid: chatSession.uuid }).toArray();

    const openaiReq = NewChatCompletionRequest(chatSession, chatMessages, chatFiles);
    if (openaiReq.messages.length <= 1) throw new Error('System message notice');

    const stream = await client.CreateChatCompletionStream(context.Background(), openaiReq);
    setSSEHeader(res);

    let answer = '';
    let answer_id = chatUuid;

    for await (const response of stream) {
      const textIdx = response.choices[0].index;
      const delta = response.choices[0].delta.content;
      textBuffer.appendByIndex(textIdx, delta);

      if (chatSession.debug) {
        console.log(delta);
      }

      answer = textBuffer.String('\n');
      if (!answer_id) {
        answer_id = response.id.replace('chatcmpl-', '');
      }

      if (delta.endsWith('\n') || answer.length < 200) {
        const data = JSON.stringify(constructChatCompletionStreamResponse(answer_id, answer));
        res.write(`data: ${data}\n\n`);
      }
    }

    res.end();

    await db.collection('chat_messages').insertOne({
      sessionUuid: chatSession.uuid,
      chatUuid: answer_id,
      role: 'assistant',
      content: answer,
      userID: chatSession.userID,
      baseURL: chatModel.url,
      summarizeMode: chatSession.summarizeMode,
    });
  } catch (err) {
    RespondWithError(res, 500, 'Error processing request', err);
  }
};

const chatStreamTest = async (res, chatSession, chatMessages, chatUuid, regenerate) => {
  try {
    const chatFiles = await ChatFile.find({ sessionUuid: chatSession.uuid });
    let answer_id = chatUuid;
    if (!regenerate) {
      answer_id = uuidv4();
    }
    setSSEHeader(res);

    const answer =
      'Hi, I am a chatbot. I can help you to find the best answer for your question. Please ask me a question.';
    const data = JSON.stringify(constructChatCompletionStreamResponse(answer_id, answer));
    res.write(`data: ${data}\n\n`);

    if (chatSession.debug) {
      const openaiReq = NewChatCompletionRequest(chatSession, chatMessages, chatFiles);
      const req_j = JSON.stringify(openaiReq);
      res.write(`data: ${JSON.stringify(constructChatCompletionStreamResponse(answer_id, answer + '\n' + req_j))}\n\n`);
    }

    res.end();
  } catch (err) {
    RespondWithError(res, 500, 'Error processing request', err);
  }
};

const customChatStream = async (res, chatSession, chatMessages, chatUuid, regenerate) => {
  try {
    const db = res.app.locals.db;
    const chatModel = await db.collection('chat_models').findOne({ name: chatSession.model });
    if (!chatModel) throw new Error('Model not found');

    const prompt = FormatClaudePrompt(chatMessages);
    const jsonData = {
      prompt,
      model: chatSession.model,
      max_tokens_to_sample: chatSession.maxTokens,
      temperature: chatSession.temperature,
      stop_sequences: ['\n\nHuman:'],
      stream: true,
    };

    const req = {
      method: 'POST',
      url: chatModel.url,
      headers: {
        'Content-Type': 'application/json',
        [chatModel.apiAuthHeader]: process.env[chatModel.apiAuthKey],
      },
      data: jsonData,
    };

    const stream = await axios(req);

    setSSEHeader(res);

    let answer = '';
    let answer_id = chatUuid;
    const reader = stream.data;

    reader.on('data', chunk => {
      const line = chunk.toString().trim();
      if (line.startsWith('data:')) {
        const data = JSON.parse(line.replace('data:', '').trim());
        answer += data.content;
        if (data.stop) {
          res.write(`data: ${JSON.stringify(constructChatCompletionStreamResponse(answer_id, answer))}\n\n`);
          res.end();
        } else if (answer.length < 200 || answer.length % 2 === 0) {
          res.write(`data: ${JSON.stringify(constructChatCompletionStreamResponse(answer_id, answer))}\n\n`);
        }
      }
    });

    reader.on('end', () => {
      res.write(`data: ${JSON.stringify(constructChatCompletionStreamResponse(answer_id, answer))}\n\n`);
      res.end();
    });
  } catch (err) {
    RespondWithError(res, 500, 'Error processing request', err);
  }
};

module.exports = {
  chatStreamHandler,
  genAnswer,
  regenerateAnswer,
  chatStream,
  chatStreamTest,
  customChatStream,
  // createChatSessionHandler,
  // getChatSessionHandler,
  // updateChatSessionHandler,
  // deleteChatSessionHandler,
  // regenerateAnswerHandler,
  // getChatMessagesHandler,
  // getChatFilesHandler,
  // createChatMessageHandler,
  // deleteChatMessageHandler,
};

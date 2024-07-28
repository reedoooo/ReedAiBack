// tests/routes/chat/misc.test.js

const request = require('supertest');
const express = require('express');
const { handleUpload } = require('../../../middlewares/uploads');
const controller = require('../../../controllers').chat;
const controllers = {
  ...controller.main,
  ...controller.original,
};
const { openAIChatCompletionAPIWithStreamHandler, generate, chatStream } = controllers;

const app = express();
app.use(express.json());
app.use('/api/chat/misc', require('../../../routes/chat/Misc'));

describe('Chat Miscellaneous Routes', () => {
  it('should create a pdfFile', async () => {
    const response = await request(app)
      .post('/api/chat/misc/create')
      .attach('file', 'path/to/file.pdf');
    expect(response.status).toBe(200);
  });

  it('should handle chat stream', async () => {
    const response = await request(app).post('/api/chat/misc/stream').send({
      message: 'Test chat stream',
    });
    expect(response.status).toBe(200);
  });

  it('should handle chat stream with OpenAI chat completion API', async () => {
    const response = await request(app).post('/api/chat/misc/chat_stream').send({
      message: 'Test chat stream with OpenAI',
    });
    expect(response.status).toBe(200);
  });
});

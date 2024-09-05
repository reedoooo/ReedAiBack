const express = require('express');
const request = require('supertest');
const chatRoutes = require('@/routes');
// const chatSessionsRoutes = require('../chat/Sessions');
// const chatMessagesRoutes = require('../chat/Messages');

jest.mock('../chat/Sessions');
jest.mock('../chat/Messages');

describe('Chat Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/chat', chatRoutes);
  });

  it('should setup /chat_sessions routes', async () => {
    const res = await request(app).get('/api/chat/chat_sessions');
    expect(res.status).not.toBe(404);
  });

  it('should setup /chat_messages routes', async () => {
    const res = await request(app).get('/api/chat/chat_messages');
    expect(res.status).not.toBe(404);
  });
});

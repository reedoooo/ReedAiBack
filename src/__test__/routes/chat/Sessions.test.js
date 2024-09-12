const express = require('express');
const request = require('supertest');
const chatSessionsRoutes = require('../chat/Sessions');
const controller = require('@/config/env/controllers').chat;

jest.mock('@/controllers');

describe('Chat Sessions Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/chat/chat_sessions', chatSessionsRoutes);
  });

  it('should call createChatSessionHandler controller on POST /', async () => {
    controller.sessions.createChatSessionHandler.mockResolvedValue({});

    const res = await request(app).post('/api/chat/chat_sessions').send({
      userId: '123',
      chatId: '456',
    });

    expect(controller.sessions.createChatSessionHandler).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });

  it('should call getChatSessionHandler controller on GET /:id', async () => {
    controller.sessions.getChatSessionHandler.mockResolvedValue({});

    const res = await request(app).get('/api/chat/chat_sessions/123');

    expect(controller.sessions.getChatSessionHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call updateChatSessionHandler controller on PUT /:id', async () => {
    controller.sessions.updateChatSessionHandler.mockResolvedValue({});

    const res = await request(app).put('/api/chat/chat_sessions/123').send({
      topic: 'New Topic',
    });

    expect(controller.sessions.updateChatSessionHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call deleteChatSessionHandler controller on DELETE /:id', async () => {
    controller.sessions.deleteChatSessionHandler.mockResolvedValue({});

    const res = await request(app).delete('/api/chat/chat_sessions/123');

    expect(controller.sessions.deleteChatSessionHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call getAllChatSessionsHandler controller on GET /', async () => {
    controller.sessions.getAllChatSessionsHandler.mockResolvedValue({});

    const res = await request(app).get('/api/chat/chat_sessions');

    expect(controller.sessions.getAllChatSessionsHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call getChatSessionByIdHandler controller on GET /uuid/:uuid', async () => {
    controller.sessions.getChatSessionByIdHandler.mockResolvedValue({});

    const res = await request(app).get('/api/chat/chat_sessions/uuid/123');

    expect(controller.sessions.getChatSessionByIdHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call updateChatSessionByIdHandler controller on PUT /uuid/:uuid', async () => {
    controller.sessions.updateChatSessionByIdHandler.mockResolvedValue({});

    const res = await request(app).put('/api/chat/chat_sessions/uuid/123').send({
      topic: 'Updated Topic',
    });

    expect(controller.sessions.updateChatSessionByIdHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call deleteChatSessionByIdHandler controller on DELETE /uuid/:uuid', async () => {
    controller.sessions.deleteChatSessionByIdHandler.mockResolvedValue({});

    const res = await request(app).delete('/api/chat/chat_sessions/uuid/123');

    expect(controller.sessions.deleteChatSessionByIdHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call getChatSessionsByUserIDHandler controller on GET /users/:userID', async () => {
    controller.sessions.getChatSessionsByUserIDHandler.mockResolvedValue({});

    const res = await request(app).get('/api/chat/chat_sessions/users/123');

    expect(controller.sessions.getChatSessionsByUserIDHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call getSimpleChatSessionsByUserIDHandler controller on GET /simple/users/:userID', async () => {
    controller.sessions.getSimpleChatSessionsByUserIDHandler.mockResolvedValue({});

    const res = await request(app).get('/api/chat/chat_sessions/simple/users/123');

    expect(controller.sessions.getSimpleChatSessionsByUserIDHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call getActiveChatSessionHandler controller on GET /user_active', async () => {
    controller.sessions.getActiveChatSessionHandler.mockResolvedValue({});

    const res = await request(app).get('/api/chat/chat_sessions/user_active');

    expect(controller.sessions.getActiveChatSessionHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call updateActiveChatSessionHandler controller on PUT /user_active', async () => {
    controller.sessions.updateActiveChatSessionHandler.mockResolvedValue({});

    const res = await request(app).put('/api/chat/chat_sessions/user_active').send({
      sessionUuid: 'updated-session-uuid',
    });

    expect(controller.sessions.updateActiveChatSessionHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});

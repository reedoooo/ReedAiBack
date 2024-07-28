const express = require('express');
const request = require('supertest');
const chatMessagesRoutes = require('../chat/Messages');
const controller = require('../../../controllers').chat;

jest.mock('../../../controllers');

describe('Chat Messages Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/chat/chat_messages', chatMessagesRoutes);
  });

  it('should call createChatMessageHandler controller on POST /', async () => {
    controller.messages.createChatMessageHandler.mockResolvedValue({});

    const res = await request(app).post('/api/chat/chat_messages').send({
      content: 'Test message',
      chatId: '123',
      userId: '456',
    });

    expect(controller.messages.createChatMessageHandler).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });

  it('should call getChatMessageHandler controller on GET /:id', async () => {
    controller.messages.getChatMessageHandler.mockResolvedValue({});

    const res = await request(app).get('/api/chat/chat_messages/123');

    expect(controller.messages.getChatMessageHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call updateChatMessageHandler controller on PUT /:id', async () => {
    controller.messages.updateChatMessageHandler.mockResolvedValue({});

    const res = await request(app).put('/api/chat/chat_messages/123').send({
      content: 'Updated message',
    });

    expect(controller.messages.updateChatMessageHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call deleteChatMessageHandler controller on DELETE /:id', async () => {
    controller.messages.deleteChatMessageHandler.mockResolvedValue({});

    const res = await request(app).delete('/api/chat/chat_messages/123');

    expect(controller.messages.deleteChatMessageHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call getAllChatMessagesHandler controller on GET /', async () => {
    controller.messages.getAllChatMessagesHandler.mockResolvedValue({});

    const res = await request(app).get('/api/chat/chat_messages');

    expect(controller.messages.getAllChatMessagesHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call getChatMessageByIdHandler controller on GET /uuid/:uuid', async () => {
    controller.messages.getChatMessageByIdHandler.mockResolvedValue({});

    const res = await request(app).get('/api/chat/chat_messages/uuid/123');

    expect(controller.messages.getChatMessageByIdHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call updateChatMessageByIdHandler controller on PUT /uuid/:uuid', async () => {
    controller.messages.updateChatMessageByIdHandler.mockResolvedValue({});

    const res = await request(app).put('/api/chat/chat_messages/uuid/123').send({
      content: 'Updated message',
    });

    expect(controller.messages.updateChatMessageByIdHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call deleteChatMessageByIdHandler controller on DELETE /uuid/:uuid', async () => {
    controller.messages.deleteChatMessageByIdHandler.mockResolvedValue({});

    const res = await request(app).delete('/api/chat/chat_messages/uuid/123');

    expect(controller.messages.deleteChatMessageByIdHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call getChatMessagesBySessionIdHandler controller on GET /uuid/chat_sessions/:uuid', async () => {
    controller.messages.getChatMessagesBySessionIdHandler.mockResolvedValue({});

    const res = await request(app).get('/api/chat/chat_messages/uuid/chat_sessions/123');

    expect(controller.messages.getChatMessagesBySessionIdHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call getChatHistoryBySessionIdHandler controller on GET /uuid/chat_history/chat_sessions/:uuid', async () => {
    controller.messages.getChatHistoryBySessionIdHandler.mockResolvedValue({});

    const res = await request(app).get('/api/chat/chat_messages/uuid/chat_history/chat_sessions/123');

    expect(controller.messages.getChatHistoryBySessionIdHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call deleteChatMessagesBySessionIdHandler controller on DELETE /uuid/chat_sessions/:uuid', async () => {
    controller.messages.deleteChatMessagesBySessionIdHandler.mockResolvedValue({});

    const res = await request(app).delete('/api/chat/chat_messages/uuid/chat_sessions/123');

    expect(controller.messages.deleteChatMessagesBySessionIdHandler).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});

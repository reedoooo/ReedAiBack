// tests/routes/chat/prompts.test.js

const request = require('supertest');
const express = require('express');
const controller = require('@/controllers').chat;

const {
  createChatPrompt,
  getChatPromptByID,
  updateChatPrompt,
  deleteChatPrompt,
  getAllChatPrompts,
  getChatPromptsByUserID,
  deleteChatPromptById,
  updateChatPromptById,
} = controller.prompts;

const app = express();
app.use(express.json());
app.use('/api/chat/prompts', require('@/routes/chat/Prompts'));

describe('Chat Prompts Routes', () => {
  it('should create a chat prompt', async () => {
    const response = await request(app).post('/api/chat/prompts').send({
      name: 'New Prompt',
    });
    expect(response.status).toBe(200);
  });

  it('should get a chat prompt by ID', async () => {
    const response = await request(app).get('/api/chat/prompts/123');
    expect(response.status).toBe(200);
  });

  it('should update a chat prompt by ID', async () => {
    const response = await request(app).put('/api/chat/prompts/123').send({
      name: 'Updated Prompt',
    });
    expect(response.status).toBe(200);
  });

  it('should delete a chat prompt by ID', async () => {
    const response = await request(app).delete('/api/chat/prompts/123');
    expect(response.status).toBe(200);
  });

  it('should get all chat prompts', async () => {
    const response = await request(app).get('/api/chat/prompts');
    expect(response.status).toBe(200);
  });

  it('should get chat prompts by user ID', async () => {
    const response = await request(app).get('/api/chat/prompts/users');
    expect(response.status).toBe(200);
  });

  it('should delete a chat prompt by Id', async () => {
    const response = await request(app).delete('/api/chat/prompts/uuid/123e4567-e89b-12d3-a456-426614174000');
    expect(response.status).toBe(200);
  });

  it('should update a chat prompt by Id', async () => {
    const response = await request(app).put('/api/chat/prompts/uuid/123e4567-e89b-12d3-a456-426614174000').send({
      name: 'Updated Prompt by Id',
    });
    expect(response.status).toBe(200);
  });
});

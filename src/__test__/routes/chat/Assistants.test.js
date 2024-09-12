// tests/routes/chat/assistants.test.js

const request = require('supertest');
const express = require('express');
const { handleUpload } = require('@/middlewares/uploads');
const controller = require('@/config/env/controllers').chat;
const { getAssistantImage, uploadAssistantImage, getAssistants, createAssistant, updateAssistant, deleteAssistant } =
  controller.assistants;

const app = express();
app.use(express.json());
app.use('/api/chat/assistants', require('../../../../ignore/assistants'));

describe('Chat Assistants Routes', () => {
  it('should get an assistant image', async () => {
    const response = await request(app).get('/api/chat/assistants/123/image');
    expect(response.status).toBe(200);
  });

  it('should upload an assistant image', async () => {
    const response = await request(app)
      .post('/api/chat/assistants/upload/123/image')
      .attach('image', 'path/to/image.jpg');
    expect(response.status).toBe(200);
  });

  it('should get assistants', async () => {
    const response = await request(app).post('/api/chat/assistants');
    expect(response.status).toBe(200);
  });

  it('should create an assistant', async () => {
    const response = await request(app).post('/api/chat/assistants/create').send({
      name: 'New Assistant',
    });
    expect(response.status).toBe(200);
  });

  it('should update an assistant', async () => {
    const response = await request(app).put('/api/chat/assistants/update').send({
      name: 'Updated Assistant',
    });
    expect(response.status).toBe(200);
  });

  it('should delete an assistant', async () => {
    const response = await request(app).delete('/api/chat/assistants/delete');
    expect(response.status).toBe(200);
  });
});

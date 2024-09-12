// tests/routes/chat/folders.test.js

const request = require('supertest');
const express = require('express');
const controller = require('@/config/env/controllers').chat;
const { getFolders, createFolder, updateFolder, deleteFolder } = controller.folders;

const app = express();
app.use(express.json());
app.use('/api/chat/folders', require('@/routes/chat/Folders'));

describe('Chat Folders Routes', () => {
  it('should get all folders', async () => {
    const response = await request(app).get('/api/chat/folders');
    expect(response.status).toBe(200);
  });

  it('should create a folder', async () => {
    const response = await request(app).post('/api/chat/folders').send({
      name: 'New Folder',
    });
    expect(response.status).toBe(200);
  });

  it('should update a folder by ID', async () => {
    const response = await request(app).put('/api/chat/folders/123').send({
      name: 'Updated Folder',
    });
    expect(response.status).toBe(200);
  });

  it('should delete a folder by ID', async () => {
    const response = await request(app).delete('/api/chat/folders/123');
    expect(response.status).toBe(200);
  });
});

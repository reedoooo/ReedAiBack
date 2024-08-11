// tests/routes/chat/workspaces.test.js

const request = require('supertest');
const express = require('express');
const { handleUpload } = require('@/middlewares/uploads');
const controller = require('@/controllers').chat;
const {
  createHomeWorkspace,
  getWorkspaceImage,
  getHomeWorkspaceByUserId,
  getWorkspacesByUserId,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceById,
  uploadWorkspaceImage,
} = controller.workspaces;

const app = express();
app.use(express.json());
app.use('/api/chat/workspaces', require('@/routes/chat/Workspaces'));

describe('Chat Workspaces Routes', () => {
  it('should create a home workspace', async () => {
    const response = await request(app).post('/api/chat/workspaces/create-home/123');
    expect(response.status).toBe(200);
  });

  it('should upload a workspace image', async () => {
    const response = await request(app).post('/api/chat/workspaces/upload/123').attach('image', 'path/to/image.jpg');
    expect(response.status).toBe(200);
  });

  it('should get a workspace image', async () => {
    const response = await request(app).get('/api/chat/workspaces/image/123');
    expect(response.status).toBe(200);
  });

  it('should get a home workspace by user ID', async () => {
    const response = await request(app).get('/api/chat/workspaces/home/123');
    expect(response.status).toBe(200);
  });

  it('should get a workspace by ID', async () => {
    const response = await request(app).get('/api/chat/workspaces/123');
    expect(response.status).toBe(200);
  });

  it('should get workspaces by user ID', async () => {
    const response = await request(app).get('/api/chat/workspaces/user/123');
    expect(response.status).toBe(200);
  });

  it('should create a workspace', async () => {
    const response = await request(app).post('/api/chat/workspaces').send({
      name: 'New Workspace',
    });
    expect(response.status).toBe(200);
  });

  it('should update a workspace by ID', async () => {
    const response = await request(app).put('/api/chat/workspaces/123').send({
      name: 'Updated Workspace',
    });
    expect(response.status).toBe(200);
  });

  it('should delete a workspace by ID', async () => {
    const response = await request(app).delete('/api/chat/workspaces/123');
    expect(response.status).toBe(200);
  });
});

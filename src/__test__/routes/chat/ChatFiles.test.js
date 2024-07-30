// tests/routes/chat/chatFiles.test.js

const request = require('supertest');
const express = require('express');
const { handleUpload } = require('../../../middlewares/upload'); // Adjust the path if necessary
const controller = require('../../../controllers').chat;

const {
  getChatFilesByChatId,
  createChatFile,
  createChatFiles,
  receiveFile,
  downloadFile,
  deleteFile,
  chatFilesBySessionId,
} = controller.chatFiles;

const app = express();
app.use(express.json());
app.use('/api/chat/files', require('../../../routes/chat/ChatFiles'));

describe('Chat Files Routes', () => {
  it('should upload a file', async () => {
    const response = await request(app).post('/api/chat/files/upload').attach('file', 'path/to/file.txt');
    expect(response.status).toBe(200);
  });

  it('should get chat files by session Id', async () => {
    const response = await request(app).get('/api/chat/files/chat_file/123/list');
    expect(response.status).toBe(200);
  });

  it('should download a file', async () => {
    const response = await request(app).get('/api/chat/files/download/123');
    expect(response.status).toBe(200);
  });

  it('should delete a file', async () => {
    const response = await request(app).delete('/api/chat/files/download/123');
    expect(response.status).toBe(200);
  });

  it('should get chat files by chat ID', async () => {
    const response = await request(app).get('/api/chat/files/chat_file/123');
    expect(response.status).toBe(200);
  });

  it('should create a chat file', async () => {
    const response = await request(app).post('/api/chat/files/chat_file').send({
      name: 'New File',
    });
    expect(response.status).toBe(200);
  });

  it('should create multiple chat files', async () => {
    const response = await request(app)
      .post('/api/chat/files/chat_files')
      .send([
        {
          name: 'New File 1',
        },
        {
          name: 'New File 2',
        },
      ]);
    expect(response.status).toBe(200);
  });
});

const request = require('supertest');
const express = require('express');
const app = express();

// Import all route files
const authRoutes = require('../routes/auth');
const chatRoutes = require('../routes/chat-sessions');
const fileRoutes = require('../routes/files');
const userRoutes = require('../routes/user');

// Use the routes
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/files', fileRoutes);
app.use('/user', userRoutes);

describe('Router Tests', () => {
  // Auth Routes
  describe('Auth Routes', () => {
    it('should respond to /auth endpoints', async () => {
      const res = await request(app).get('/auth');
      expect(res.status).not.toBe(404);
    });
  });

  // Chat Routes
  describe('Chat Routes', () => {
    const chatEndpoints = [
      'assistants',
      'chatfiles',
      'collections',
      'files',
      'folders',
      'messages',
      'models',
      'presets',
      'prompts',
      'sessions',
      'stream',
      'tools',
      'vectors',
      'workspaces',
    ];

    chatEndpoints.forEach(endpoint => {
      it(`should respond to /chat/${endpoint} endpoint`, async () => {
        const res = await request(app).get(`/chat/${endpoint}`);
        expect(res.status).not.toBe(404);
      });
    });
  });

  // File Routes
  describe('File Routes', () => {
    it('should respond to /files endpoints', async () => {
      const res = await request(app).get('/files');
      expect(res.status).not.toBe(404);
    });
  });

  // User Routes
  describe('User Routes', () => {
    it('should respond to /user endpoints', async () => {
      const res = await request(app).get('/user');
      expect(res.status).not.toBe(404);
    });
  });
});
// const express = require('express');
// const request = require('supertest');
// const setupRoutes = require('../routes');

// jest.mock ('../routes/user', () => (req, res) => res.send('User Route'));
// jest.mock ('../routes/chat', () => (req, res) => res.send('Chat Route'));

// describe('Main Routes Setup', () => {
//   let app;

//   beforeEach(() => {
//     app = express();
//     setupRoutes(app);
//   });

//   test("should correctly mount user routes on /api/user", async () => {
//     const response = await request(app).get("/api/user");
//     expect(response.text).toBe("User Route"); // Expect the mocked user route to respond
//     expect(response.statusCode).toBe(200); // Expect a 200 OK response
//   });

//   test("should correctly mount chat routes on /api/chat", async () => {
//     const response = await request(app).get("/api/chat");
//     expect(response.text).toBe("Chat Route"); // Expect the mocked chat route to respond
//     expect(response.statusCode).toBe(200); // Expect a 200 OK response
//   });
// });

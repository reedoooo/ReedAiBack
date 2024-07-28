const express = require('express');
const request = require('supertest');
const setupRoutes = require('../routes');

jest.mock ('../routes/user', () => (req, res) => res.send('User Route'));
jest.mock ('../routes/chat', () => (req, res) => res.send('Chat Route'));

describe('Main Routes Setup', () => {
  let app;

  beforeEach(() => {
    app = express();
    setupRoutes(app);
  });

  test("should correctly mount user routes on /api/user", async () => {
    const response = await request(app).get("/api/user");
    expect(response.text).toBe("User Route"); // Expect the mocked user route to respond
    expect(response.statusCode).toBe(200); // Expect a 200 OK response
  });

  test("should correctly mount chat routes on /api/chat", async () => {
    const response = await request(app).get("/api/chat");
    expect(response.text).toBe("Chat Route"); // Expect the mocked chat route to respond
    expect(response.statusCode).toBe(200); // Expect a 200 OK response
  });
});

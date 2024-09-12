const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const userController = require('../config/env/controllers').user;
const userService = require('../config/env/controllers').services;
const { User, Workspace, Chat, ChatSession, Message } = require('../models');
const app = require('../app');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../services/userService');
jest.mock('../../config/winston', () => ({ info: jest.fn(), error: jest.fn() }));

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('User Controller', () => {
  describe('registerUser', () => {
    it('should register a user and return a token', async () => {
      const user = { _id: 'userId', username: 'testuser' };
      userService.registerUser.mockResolvedValue(user);
      jwt.sign.mockReturnValue('token');

      const res = await request(app)
        .post('/api/register')
        .send({ username: 'testuser', email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token', 'token');
      expect(res.body).toHaveProperty('userId', 'userId');
      expect(res.body).toHaveProperty('message', 'User registered successfully');
    });

    it('should return 500 if registration fails', async () => {
      userService.registerUser.mockRejectedValue(new Error('Registration error'));

      const res = await request(app)
        .post('/api/register')
        .send({ username: 'testuser', email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Error registering user');
    });
  });

  describe('loginUser', () => {
    it('should login a user and return a token', async () => {
      const user = { _id: 'userId', email: 'test@test.com' };
      const token = 'token';
      userService.loginUser.mockResolvedValue({ user, token });

      const res = await request(app)
        .post('/api/login')
        .send({ usernameOrEmail: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token', 'token');
      expect(res.body).toHaveProperty('userId', 'userId');
      expect(res.body).toHaveProperty('message', 'Logged in successfully');
    });

    it('should return 500 if login fails', async () => {
      userService.loginUser.mockRejectedValue(new Error('Login error'));

      const res = await request(app)
        .post('/api/login')
        .send({ usernameOrEmail: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Error logging in');
    });
  });

  describe('logoutUser', () => {
    it('should logout a user', async () => {
      userService.logoutUser.mockResolvedValue(true);

      const res = await request(app).post('/api/logout').send({ token: 'token' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Logged out successfully');
    });

    it('should return 500 if logout fails', async () => {
      userService.logoutUser.mockRejectedValue(new Error('Logout error'));

      const res = await request(app).post('/api/logout').send({ token: 'token' });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Error logging out');
    });
  });

  describe('validateToken', () => {
    it('should validate a token', async () => {
      userService.validateToken.mockResolvedValue(true);

      const res = await request(app).post('/api/validate-token').send({ token: 'token' });

      expect(res.status).toBe(200);
      expect(res.text).toBe('Token is valid');
    });

    it('should return 401 if token is invalid', async () => {
      userService.validateToken.mockRejectedValue(new Error('Invalid token'));

      const res = await request(app).post('/api/validate-token').send({ token: 'invalid-token' });

      expect(res.status).toBe(401);
      expect(res.text).toBe('Invalid token');
    });
  });

  describe('uploadProfileImage', () => {
    it('should upload a profile image', async () => {
      userService.uploadProfileImage.mockResolvedValue({ imagePath: 'path/to/image' });

      const res = await request(app).post('/api/upload-profile-image').send({ userId: 'userId' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('imagePath', 'path/to/image');
    });

    it('should return 500 if upload fails', async () => {
      userService.uploadProfileImage.mockRejectedValue(new Error('Upload error'));

      const res = await request(app).post('/api/upload-profile-image').send({ userId: 'userId' });

      expect(res.status).toBe(500);
      expect(res.text).toBe('Error uploading image: Upload error');
    });
  });

  describe('getProfileImage', () => {
    it('should get a profile image', async () => {
      userService.getProfileImage.mockResolvedValue('path/to/image');

      const res = await request(app).get('/api/profile-image/userId');

      expect(res.status).toBe(200);
      expect(res.text).toBe('path/to/image');
    });

    it('should return 500 if retrieval fails', async () => {
      userService.getProfileImage.mockRejectedValue(new Error('Retrieval error'));

      const res = await request(app).get('/api/profile-image/userId');

      expect(res.status).toBe(500);
      expect(res.text).toBe('Error retrieving image: Retrieval error');
    });
  });
});

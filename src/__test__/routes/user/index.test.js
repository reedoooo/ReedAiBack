const express = require('express');
const request = require('supertest');
const multer = require('multer');
const userRoutes = require('@/routes');
const userController = require('../../controllers/user/controller');

jest.mock('../../controllers/user/controller');
const upload = multer({ dest: 'uploads/' });

describe('User Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/user', userRoutes);
  });

  it('should call registerUser controller on /register', async () => {
    userController.registerUser.mockResolvedValue({});

    const res = await request(app).post('/api/user/register').send({
      username: 'testuser',
      email: 'test@test.com',
      password: 'password123',
    });

    expect(userController.registerUser).toHaveBeenCalled();
    expect(res.status).toBe(201);
  });

  it('should call loginUser controller on /login', async () => {
    userController.loginUser.mockResolvedValue({});

    const res = await request(app).post('/api/user/login').send({
      usernameOrEmail: 'testuser',
      password: 'password123',
    });

    expect(userController.loginUser).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call logoutUser controller on /logout', async () => {
    userController.logoutUser.mockResolvedValue({});

    const res = await request(app).post('/api/user/logout');

    expect(userController.logoutUser).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call validateToken controller on /validate-token', async () => {
    userController.validateToken.mockResolvedValue({});

    const res = await request(app).get('/api/user/validate-token');

    expect(userController.validateToken).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call uploadProfileImage controller on /upload-profile-image/:userId', async () => {
    userController.uploadProfileImage.mockResolvedValue({});

    const res = await request(app)
      .post('/api/user/upload-profile-image/123')
      .attach('image', Buffer.from('test'), 'test.png');

    expect(userController.uploadProfileImage).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it('should call getProfileImage controller on /profile-image/:userId', async () => {
    userController.getProfileImage.mockResolvedValue({});

    const res = await request(app).get('/api/user/profile-image/123');

    expect(userController.getProfileImage).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});

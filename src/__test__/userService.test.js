const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Workspace, Chat, ChatSession, Message } = require('../models');
const userService = require('../controllers').services;

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../models');

describe('User Service', () => {
  describe('registerUser', () => {
    it('should register a user and return the user', async () => {
      const userData = { username: 'testuser', email: 'test@test.com', password: 'password123' };
      bcrypt.hash.mockResolvedValue('hashedpassword');
      User.findOne.mockResolvedValue(null);
      User.prototype.save = jest.fn().mockResolvedValue(userData);

      const user = await userService.registerUser(userData);

      expect(user.username).toBe('testuser');
      expect(User.findOne).toHaveBeenCalledWith({ $or: [{ email: 'test@test.com' }, { username: 'testuser' }] });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw an error if the user already exists', async () => {
      const userData = { username: 'testuser', email: 'test@test.com', password: 'password123' };
      User.findOne.mockResolvedValue(userData);

      await expect(userService.registerUser(userData)).rejects.toThrow('Username or email already exists');
    });
  });

  describe('loginUser', () => {
    it('should login a user and return a token', async () => {
      const userData = { _id: 'userId', username: 'testuser', email: 'test@test.com', password: 'hashedpassword' };
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token');
      User.findOne.mockResolvedValue(userData);

      const { user, token } = await userService.loginUser('test@test.com', 'password123');

      expect(user.email).toBe('test@test.com');
      expect(token).toBe('token');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
    });

    it('should throw an error if the user is not found', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(userService.loginUser('test@test.com', 'password123')).rejects.toThrow('User not found');
    });

    it('should throw an error if the password is incorrect', async () => {
      const userData = { username: 'testuser', email: 'test@test.com', password: 'hashedpassword' };
      User.findOne.mockResolvedValue(userData);
      bcrypt.compare.mockResolvedValue(false);

      await expect(userService.loginUser('test@test.com', 'password123')).rejects.toThrow(
        'Invalid username or password'
      );
    });
  });
});

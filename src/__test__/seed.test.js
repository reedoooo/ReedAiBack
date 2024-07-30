const mongoose = require('mongoose');
const { seedDatabase } = require('../path/to/seed');
const { User, Workspace, Folder, File, Chat, ChatSession, Message } = require('../models');
const { connectDB, disconnectDB } = require('../config/database.js');

describe('Database Seed', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('should seed the database correctly', async () => {
    await seedDatabase();

    const users = await User.find();
    const workspaces = await Workspace.find();
    const folders = await Folder.find();
    const files = await File.find();
    const chats = await Chat.find();
    const chatSessions = await ChatSession.find();
    const messages = await Message.find();

    expect(users.length).toBeGreaterThan(0);
    expect(workspaces.length).toBeGreaterThan(0);
    expect(folders.length).toBeGreaterThan(0);
    expect(files.length).toBeGreaterThan(0);
    expect(chats.length).toBeGreaterThan(0);
    expect(chatSessions.length).toBeGreaterThan(0);
    expect(messages.length).toBeGreaterThan(0);
  });
});

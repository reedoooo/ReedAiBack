const mongoose = require('mongoose');
const config = require('../config');
const { logger } = config;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.db);
    logger.info(`MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

const getDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  await connectDB();
  return mongoose.connection;
};

const disconnectDB = async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
};

module.exports = { connectDB, getDB, disconnectDB };

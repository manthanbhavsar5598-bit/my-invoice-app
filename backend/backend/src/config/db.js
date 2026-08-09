const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Fail fast on unresolved queries instead of buffering forever
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    logger.error('MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10, // connection pooling for throughput under load
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB runtime error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
};

module.exports = connectDB;

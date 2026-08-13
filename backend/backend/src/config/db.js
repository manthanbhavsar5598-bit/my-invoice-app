const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Fail fast on unresolved queries instead of buffering forever
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);

// On serverless platforms (Vercel) a new function invocation can reuse a
// "warm" container, so we cache the connection promise on `global` to avoid
// opening a fresh MongoDB connection (and exhausting Atlas's connection
// limit) on every request. On a traditional long-running server (Render/
// Railway/local) this simply resolves once and is reused for the process
// lifetime, same as before.
let cached = global._mongooseConn;
if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        maxPoolSize: 10, // connection pooling for throughput under load
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4
      })
      .then((conn) => {
        logger.info(`MongoDB connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
          logger.error(`MongoDB runtime error: ${err.message}`);
        });

        mongoose.connection.on('disconnected', () => {
          logger.warn('MongoDB disconnected');
        });

        return conn;
      })
      .catch((err) => {
        cached.promise = null; // allow retry on next invocation
        logger.error(`MongoDB connection error: ${err.message}`);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;

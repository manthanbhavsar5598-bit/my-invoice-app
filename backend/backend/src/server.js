require('dotenv').config();

const logger = require('./utils/logger');

// Catch programming errors that happen outside Express's request cycle
// (e.g. in a stray Promise) before the DB/app is even wired up.
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION: ${err.name} - ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

let server;

const start = async () => {
  await connectDB();

  server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

start();

// Any unhandled Promise rejection (e.g. a DB call that slipped past
// catchAsync) is logged and the process is shut down cleanly rather than
// left in an undefined state.
process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION: ${err.name} - ${err.message}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Graceful shutdown on deploy restarts / container stop signals
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close(() => logger.info('Process terminated.'));
  }
});

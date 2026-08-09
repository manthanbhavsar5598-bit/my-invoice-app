const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const handleCastError = (err) => new ApiError(400, `Invalid ${err.path}: ${err.value}`);

const handleDuplicateFieldError = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  return new ApiError(409, `Duplicate value for ${field}. Please use another value.`);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  const error = new ApiError(422, `Invalid input data: ${messages.join('. ')}`);
  return error;
};

const handleJWTError = () => new ApiError(401, 'Invalid token. Please log in again.');
const handleJWTExpired = () => new ApiError(401, 'Your session has expired. Please log in again.');

// Centralized error handler — must be registered last, after all routes.
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err.name === 'CastError') error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateFieldError(err);
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpired();

  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational !== undefined ? error.isOperational : false;

  if (!isOperational) {
    logger.error(err.stack || err.message);
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational ? error.message : 'Something went wrong on our end.',
    ...(error.details ? { details: error.details } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

module.exports = { errorHandler, notFound };

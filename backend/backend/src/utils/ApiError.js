class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational; // distinguishes expected vs programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;

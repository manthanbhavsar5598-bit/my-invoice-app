const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Runs an array of express-validator chains, then throws a single
// formatted ApiError if any of them failed.
const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((validation) => validation.run(req)));

  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  const error = new ApiError(422, 'Validation failed');
  error.details = formatted;
  next(error);
};

module.exports = validate;

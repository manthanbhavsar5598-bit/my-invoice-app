const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

// Verifies the JWT, loads the current user, and rejects tokens issued
// before a password change (so old sessions die on password reset).
const protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError(401, 'You are not logged in. Please log in to get access.');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    throw new ApiError(401, 'The user belonging to this token no longer exists.');
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    throw new ApiError(401, 'Password was recently changed. Please log in again.');
  }

  req.user = currentUser;
  next();
});

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new ApiError(403, 'You do not have permission to perform this action.');
  }
  next();
};

module.exports = { protect, restrictTo };

const rateLimit = require('express-rate-limit');

const windowMinutes = Number(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15;
const maxRequests = Number(process.env.RATE_LIMIT_MAX) || 200;

// General limiter applied to all /api routes
const apiLimiter = rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

// Tighter limiter for login/signup to slow down brute-force / credential stuffing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Please try again in 15 minutes.' }
});

module.exports = { apiLimiter, authLimiter };

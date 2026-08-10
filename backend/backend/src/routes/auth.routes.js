const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post(
  '/signup',
  authLimiter,
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ]),
  authController.signup
);

router.post(
  '/login',
  authLimiter,
  validate([
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ]),
  authController.login
);

router.post('/logout', authController.logout);

// Password reset — PIN based, no current password required. Available from
// both the Login page and the Settings page (Settings page doesn't require
// a session for this call, since the whole point is "I forgot it").
router.post(
  '/forgot-password',
  authLimiter,
  validate([body('email').isEmail().withMessage('Valid email is required').normalizeEmail()]),
  authController.requestPasswordReset
);

router.post(
  '/reset-password',
  authLimiter,
  validate([
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('pin').notEmpty().withMessage('PIN is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
  ]),
  authController.resetPasswordWithPin
);

router.get('/me', protect, authController.getMe);
router.patch('/update-me', protect, authController.updateMe);
router.patch(
  '/update-password',
  protect,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
  ]),
  authController.updatePassword
);

module.exports = router;
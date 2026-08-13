const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// Only this account is permitted to use the password-reset flow.
const RESET_ALLOWED_EMAIL = 'manthanbhavsar5598@gmail.com';

const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = () => ({
  expires: new Date(
    Date.now() + (Number(process.env.JWT_COOKIE_EXPIRES_DAYS) || 7) * 24 * 60 * 60 * 1000
  ),
  httpOnly: true, // not accessible from JS -> mitigates XSS token theft
  secure: isProd, // HTTPS only in prod (required for SameSite=None)
  // Frontend and backend live on two different *.vercel.app domains, which
  // browsers treat as cross-site. SameSite=None is required for the cookie
  // to be sent on those cross-site fetch() calls; SameSite=None only works
  // when secure is also true, which is why this is prod-only.
  sameSite: isProd ? 'none' : 'lax'
});

const sendAuthResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.cookie('token', token, cookieOptions());

  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: { user }
  });
};

exports.signup = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  const user = await User.create({ name, email, password });
  sendAuthResponse(user, 201, res);
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Incorrect email or password.');
  }

  sendAuthResponse(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 1000),
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax'
  });
  res.status(200).json({ success: true, message: 'Logged out.' });
};

exports.getMe = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
});

// User-level fields only (name + app settings). Company data never lives here.
exports.updateMe = catchAsync(async (req, res) => {
  const { name, settings } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      $set: {
        ...(name !== undefined && { name }),
        ...(settings?.sendEmailOnInvoiceCreate !== undefined && {
          'settings.sendEmailOnInvoiceCreate': settings.sendEmailOnInvoiceCreate
        }),
        ...(settings?.currencySymbol !== undefined && { 'settings.currencySymbol': settings.currencySymbol })
      }
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: { user } });
});

// Settings-page password change — still requires the current password.
exports.updatePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect.');
  }

  user.password = newPassword;
  await user.save();

  sendAuthResponse(user, 200, res);
});

// --- PIN-based password reset (Login page + Settings page). No current password needed. ---

// Step 1: user asks for a reset PIN. Only the single configured account is allowed.
exports.requestPasswordReset = catchAsync(async (req, res) => {
  const { email } = req.body;

  if ((email || '').toLowerCase().trim() !== RESET_ALLOWED_EMAIL) {
    throw new ApiError(403, 'Password reset is not available for this account.');
  }

  const user = await User.findOne({ email: RESET_ALLOWED_EMAIL });
  if (!user) throw new ApiError(404, 'Account not found.');

  const pin = String(crypto.randomInt(100000, 1000000)); // random 6-digit PIN
  user.resetPinHash = await bcrypt.hash(pin, 10);
  user.resetPinExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      to: user.email,
      subject: 'Your password reset PIN',
      text: `Your password reset PIN is ${pin}. It expires in 15 minutes.`
    });
  } catch (err) {
    user.resetPinHash = undefined;
    user.resetPinExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, 'Could not send the reset PIN email. Please try again.');
  }

  res.status(200).json({ success: true, message: 'A reset PIN has been emailed to the account.' });
});

// Step 2: user submits the PIN + new password. Current password is never asked for.
exports.resetPasswordWithPin = catchAsync(async (req, res) => {
  const { email, pin, newPassword } = req.body;

  if ((email || '').toLowerCase().trim() !== RESET_ALLOWED_EMAIL) {
    throw new ApiError(403, 'Password reset is not available for this account.');
  }

  const user = await User.findOne({ email: RESET_ALLOWED_EMAIL }).select('+password +resetPinHash +resetPinExpires');
  if (!user || !user.resetPinHash || !user.resetPinExpires || user.resetPinExpires < Date.now()) {
    throw new ApiError(400, 'Reset PIN is invalid or has expired. Please request a new one.');
  }

  const pinMatches = await bcrypt.compare(String(pin || ''), user.resetPinHash);
  if (!pinMatches) throw new ApiError(400, 'Incorrect PIN.');

  user.password = newPassword;
  user.resetPinHash = undefined;
  user.resetPinExpires = undefined;
  await user.save();

  sendAuthResponse(user, 200, res);
});
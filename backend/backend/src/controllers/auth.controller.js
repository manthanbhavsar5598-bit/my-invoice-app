const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const generateToken = require('../utils/generateToken');

const cookieOptions = () => ({
  expires: new Date(
    Date.now() + (Number(process.env.JWT_COOKIE_EXPIRES_DAYS) || 7) * 24 * 60 * 60 * 1000
  ),
  httpOnly: true, // not accessible from JS -> mitigates XSS token theft
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'lax'
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
  const { name, email, password, company } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  const user = await User.create({ name, email, password, company });
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
  res.cookie('token', 'loggedout', { expires: new Date(Date.now() + 1000), httpOnly: true });
  res.status(200).json({ success: true, message: 'Logged out.' });
};

exports.getMe = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
});

exports.updateMe = catchAsync(async (req, res) => {
  const { name, company } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: { ...(name && { name }), ...(company && { company }) } },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: { user } });
});

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

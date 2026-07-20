const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/User');
const { ROLES } = require('../config/constants');
const {
  issueAuthTokens,
  generateAccessToken,
  generateEmailToken,
  generateResetToken,
} = require('../utils/generateTokens');
const { generateCode } = require('../services/qrcode.service');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');
const { writeLog } = require('../services/log.service');

const CLIENT_URL = () => process.env.CLIENT_URL;

// @route POST /api/auth/register
const register = catchAsync(async (req, res) => {
  const { firstName, middleName, lastName, suffix, email, password, phone, birthdate, gender, address } =
    req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  const user = await User.create({
    firstName,
    middleName,
    lastName,
    suffix,
    email,
    password,
    phone,
    birthdate,
    gender,
    address,
    role: ROLES.RESIDENT,
    qrCode: generateCode(),
  });

  const emailToken = generateEmailToken(user);
  const verifyUrl = `${CLIENT_URL()}/verify-email/${emailToken}`;
  sendVerificationEmail(user.email, user.firstName, verifyUrl).catch((err) =>
    console.error('[Email] Verification email failed:', err.message)
  );

  await writeLog({ req, action: 'REGISTER', module: 'auth', description: `New resident registered: ${email}` });

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { id: user._id, email: user.email },
        'Registration successful. Please check your email to verify your account.'
      )
    );
});

// @route GET /api/auth/verify-email/:token
const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.params;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_EMAIL_SECRET);
  } catch {
    throw ApiError.badRequest('Invalid or expired verification link.');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.notFound('User not found.');

  user.isVerified = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, null, 'Email verified successfully. You may now log in.'));
});

// @route POST /api/auth/resend-verification
const resendVerification = catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) throw ApiError.notFound('No account found with that email.');
  if (user.isVerified) throw ApiError.badRequest('This account is already verified.');

  const emailToken = generateEmailToken(user);
  const verifyUrl = `${CLIENT_URL()}/verify-email/${emailToken}`;
  sendVerificationEmail(user.email, user.firstName, verifyUrl).catch((err) =>
    console.error('[Email] Verification email failed:', err.message)
  );

  res.status(200).json(new ApiResponse(200, null, 'Verification email resent.'));
});

// @route POST /api/auth/login
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Incorrect email or password.');
  }

  if (!user.isActive || user.isArchived) throw ApiError.forbidden('Your account has been deactivated.');
  if (!user.isVerified) throw ApiError.forbidden('Please verify your email before logging in.');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const accessToken = issueAuthTokens(res, user);
  await writeLog({ req, action: 'LOGIN', module: 'auth', description: `${user.email} logged in` });

  res.status(200).json(new ApiResponse(200, { user, accessToken }, 'Login successful'));
});

// @route POST /api/auth/refresh-token
const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw ApiError.unauthorized('No refresh token provided.');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token.');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive || user.isArchived) throw ApiError.unauthorized('Invalid session.');

  const accessToken = generateAccessToken(user);
  res.status(200).json(new ApiResponse(200, { accessToken, user }, 'Token refreshed'));
});

// @route POST /api/auth/logout
const logout = catchAsync(async (req, res) => {
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

// @route POST /api/auth/forgot-password
const forgotPassword = catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  // Always respond 200 so the endpoint can't be used to enumerate registered emails.
  if (!user) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'If that email exists, a reset link has been sent.'));
  }

  const resetToken = generateResetToken(user);
  const resetUrl = `${CLIENT_URL()}/reset-password/${resetToken}`;
  sendPasswordResetEmail(user.email, user.firstName, resetUrl).catch((err) =>
    console.error('[Email] Password reset email failed:', err.message)
  );

  res.status(200).json(new ApiResponse(200, null, 'If that email exists, a reset link has been sent.'));
});

// @route POST /api/auth/reset-password
const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
  } catch {
    throw ApiError.badRequest('Invalid or expired reset link.');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.notFound('User not found.');

  user.password = password;
  await user.save();

  await writeLog({ req, action: 'PASSWORD_RESET', module: 'auth', description: `${user.email} reset their password` });

  res.status(200).json(new ApiResponse(200, null, 'Password reset successfully. You may now log in.'));
});

// @route PATCH /api/auth/change-password (authenticated)
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect.');
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json(new ApiResponse(200, null, 'Password changed successfully.'));
});

// @route GET /api/auth/me (authenticated)
const getMe = catchAsync(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user));
});

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
};

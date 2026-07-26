const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const { ROLES } = require('../config/constants');
const { issueAuthTokens, generateAccessToken, generateResetToken } = require('../utils/generateTokens');
const { generateCode } = require('../services/qrcode.service');
const { generateOtp } = require('../utils/otp');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');
const { writeLog } = require('../services/log.service');

const CLIENT_URL = () => process.env.CLIENT_URL;

const OTP_TTL_MS = 10 * 60 * 1000; // OTP is valid for 10 minutes
const PENDING_TTL_MS = 15 * 60 * 1000; // unverified signup record self-deletes after 15 minutes

// @route POST /api/auth/register
const register = catchAsync(async (req, res) => {
  const { firstName, middleName, lastName, suffix, email, password, phone, birthdate, gender, address } =
    req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  // Replace any earlier unverified attempt for this email with a fresh one.
  await PendingRegistration.findOneAndDelete({ email });

  const otpCode = generateOtp();
  const now = Date.now();

  const pending = await PendingRegistration.create({
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
    otpCode,
    otpExpiresAt: new Date(now + OTP_TTL_MS),
    expiresAt: new Date(now + PENDING_TTL_MS),
  });

  sendVerificationEmail(pending.email, pending.firstName, otpCode).catch((err) =>
    console.error('[Email] Verification email failed:', err.message)
  );

  await writeLog({ req, action: 'REGISTER', module: 'auth', description: `New resident registration pending: ${email}` });

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { email: pending.email },
        'Registration received. Please check your email for the verification code.'
      )
    );
});

// @route POST /api/auth/verify-email
const verifyEmail = catchAsync(async (req, res) => {
  const { email, code } = req.body;

  const pending = await PendingRegistration.findOne({ email });
  if (!pending) throw ApiError.badRequest('No pending registration found for that email. Please register again.');

  if (pending.otpExpiresAt.getTime() < Date.now()) {
    throw ApiError.badRequest('Verification code expired. Please request a new one.');
  }

  const isMatch = await pending.compareOtp(code);
  if (!isMatch) throw ApiError.badRequest('Invalid verification code.');

  const user = await User.create({
    firstName: pending.firstName,
    middleName: pending.middleName,
    lastName: pending.lastName,
    suffix: pending.suffix,
    email: pending.email,
    password: pending.password, // already hashed by PendingRegistration
    phone: pending.phone,
    birthdate: pending.birthdate,
    gender: pending.gender,
    address: pending.address,
    role: ROLES.RESIDENT,
    qrCode: generateCode(),
    isVerified: true,
  });

  await PendingRegistration.deleteOne({ _id: pending._id });

  await writeLog({ req, action: 'REGISTER', module: 'auth', description: `Email verified, account created: ${email}` });

  res.status(200).json(new ApiResponse(200, { id: user._id, email: user.email }, 'Email verified successfully. You may now log in.'));
});

// @route POST /api/auth/resend-verification
const resendVerification = catchAsync(async (req, res) => {
  const pending = await PendingRegistration.findOne({ email: req.body.email });
  if (!pending) throw ApiError.notFound('No pending registration found for that email.');

  const otpCode = generateOtp();
  const now = Date.now();
  pending.otpCode = otpCode;
  pending.otpExpiresAt = new Date(now + OTP_TTL_MS);
  pending.expiresAt = new Date(now + PENDING_TTL_MS);
  await pending.save();

  sendVerificationEmail(pending.email, pending.firstName, otpCode).catch((err) =>
    console.error('[Email] Verification email failed:', err.message)
  );

  res.status(200).json(new ApiResponse(200, null, 'Verification code resent.'));
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

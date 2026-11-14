const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const { ROLES, NOTIFICATION_TYPE, LOGIN_LOCKOUT } = require('../config/constants');
const { issueAuthTokens, generateAccessToken, generateResetToken } = require('../utils/generateTokens');
const { uploadBuffer } = require('../services/cloudinary.service');
const { notifyRole } = require('../services/notification.service');
const { assertApproved } = require('../middleware/auth');
const { generateCode } = require('../services/qrcode.service');
const { generateOtp } = require('../utils/otp');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');
const { writeLog } = require('../services/log.service');
const { splitFullName } = require('../utils/splitFullName');

const CLIENT_URL = () => process.env.CLIENT_URL;

const OTP_TTL_MS = 10 * 60 * 1000; // OTP is valid for 10 minutes
const PENDING_TTL_MS = 15 * 60 * 1000; // unverified signup record self-deletes after 15 minutes

// @route POST /api/auth/register
const register = catchAsync(async (req, res) => {
  const { middleName, email, password, phone, birthdate, gender, civilStatus, residencySince } = req.body;
  // Sent as multipart form data (proof of residency upload), so booleans arrive as strings.
  const residentSinceBirth = [true, 'true'].includes(req.body.residentSinceBirth);
  // The registration screen collects a single "Full Name"; older clients still send the split fields.
  const split = req.body.fullName ? splitFullName(req.body.fullName) : {};
  const firstName = req.body.firstName || split.firstName;
  const lastName = req.body.lastName || split.lastName;
  const suffix = req.body.suffix || split.suffix;
  const extraAddress = req.body.address && typeof req.body.address === 'object' ? req.body.address : {};
  const address = { barangay: 'Magdiwang', city: 'Noveleta', province: 'Cavite', ...extraAddress };
  if (req.body.purok) address.purok = req.body.purok;
  if (req.body.street) address.street = req.body.street;

  // Panel revision: proof of residency (Barangay ID or other valid proof) is required.
  if (!req.file) throw ApiError.badRequest('Please upload your proof of residency (Barangay ID or other valid proof of residence).');

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  // Replace any earlier unverified attempt for this email with a fresh one.
  await PendingRegistration.findOneAndDelete({ email });

  const uploadedProof = await uploadBuffer(req.file.buffer, 'proof-of-residency');
  const proofOfResidency = { ...uploadedProof, docType: req.body.proofType?.trim() || '' };

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
    civilStatus,
    residencySince: residentSinceBirth ? birthdate : residencySince,
    residentSinceBirth,
    address,
    proofOfResidency,
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
    civilStatus: pending.civilStatus,
    residencySince: pending.residencySince,
    residentSinceBirth: pending.residentSinceBirth,
    address: pending.address,
    role: ROLES.RESIDENT,
    qrCode: generateCode(),
    isVerified: true,
    // Panel revision: the account waits for an official to check the proof of residency.
    approvalStatus: 'pending',
    proofOfResidency: pending.proofOfResidency,
  });

  await PendingRegistration.deleteOne({ _id: pending._id });

  const officials = await User.find({ role: { $in: [ROLES.OFFICIAL, ROLES.ADMIN] }, isArchived: false, isActive: true }).select('_id');
  await notifyRole({
    recipients: officials.map((o) => o._id),
    role: ROLES.OFFICIAL,
    type: NOTIFICATION_TYPE.SYSTEM,
    title: 'New account for review',
    message: `${user.fullName} registered and is waiting for residency verification.`,
    link: '/official/residents?approval=pending',
    relatedId: user._id,
  });

  await writeLog({ req, action: 'REGISTER', module: 'auth', description: `Email verified, account awaiting review: ${email}` });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { id: user._id, email: user.email, approvalStatus: user.approvalStatus },
        'Email verified. Your account is under review. We will email you once it is approved.'
      )
    );
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

  const user = await User.findOne({ email }).select('+password +failedLoginAttempts +lockUntil');

  // Panel revision: repeated failed attempts lock the account for a while.
  const { MAX_ATTEMPTS, LOCK_MINUTES } = LOGIN_LOCKOUT;
  const lockedMessage = (until) => {
    const minutes = Math.max(1, Math.ceil((until - Date.now()) / 60000));
    return `Your account is temporarily locked after ${MAX_ATTEMPTS} failed login attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}, or reset your password.`;
  };
  if (user?.lockUntil && user.lockUntil > Date.now()) throw new ApiError(423, lockedMessage(user.lockUntil));

  if (!user || !(await user.comparePassword(password))) {
    if (user) {
      // Atomic count so simultaneous wrong guesses are all counted; an expired lock starts a fresh count.
      const expired = user.lockUntil && user.lockUntil <= Date.now();
      const updated = await User.findByIdAndUpdate(
        user._id,
        expired ? { $set: { failedLoginAttempts: 1 }, $unset: { lockUntil: 1 } } : { $inc: { failedLoginAttempts: 1 } },
        { new: true }
      ).select('+failedLoginAttempts');
      if (updated.failedLoginAttempts >= MAX_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60000);
        await User.updateOne({ _id: user._id }, { $set: { lockUntil, failedLoginAttempts: 0 } });
        await writeLog({ req, action: 'ACCOUNT_LOCKED', module: 'auth', description: `${user.email} locked for ${LOCK_MINUTES} minutes after ${MAX_ATTEMPTS} failed logins` });
        throw new ApiError(423, lockedMessage(lockUntil));
      }
      const left = MAX_ATTEMPTS - updated.failedLoginAttempts;
      throw ApiError.unauthorized(`Incorrect email or password. ${left} attempt${left === 1 ? '' : 's'} left before your account is temporarily locked.`);
    }
    throw ApiError.unauthorized('Incorrect email or password.');
  }

  if (!user.isActive || user.isArchived) throw ApiError.forbidden('Your account has been deactivated.');
  if (!user.isVerified) throw ApiError.forbidden('Please verify your email before logging in.');
  assertApproved(user);

  user.lastLoginAt = new Date();
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
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
  assertApproved(user);

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
  // Resetting the password also lifts a temporary lock.
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save({ validateModifiedOnly: true });

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
  await user.save({ validateModifiedOnly: true });

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

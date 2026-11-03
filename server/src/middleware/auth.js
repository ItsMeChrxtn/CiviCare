const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Panel revision: self-registered residents cannot use the system until an official approves
 * their proof of residency. The error carries a code so the client can show the review screen.
 */
const assertApproved = (user) => {
  if (user.approvalStatus === 'pending') {
    throw new ApiError(403, 'Your account is under review. We will email you once it has been verified and is ready for login.', [
      { code: 'ACCOUNT_UNDER_REVIEW' },
    ]);
  }
  if (user.approvalStatus === 'rejected') {
    throw new ApiError(
      403,
      `Your registration was not approved${user.approvalNote ? `: ${user.approvalNote}` : ''}. Please visit the Barangay Hall for assistance.`,
      [{ code: 'ACCOUNT_REJECTED' }]
    );
  }
};

/** Verifies the Bearer access token and attaches the authenticated user to req.user. */
const protect = catchAsync(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) throw ApiError.unauthorized('You are not logged in. Please log in to continue.');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    throw ApiError.unauthorized(
      err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid token.'
    );
  }

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized('The user belonging to this token no longer exists.');
  if (!user.isActive || user.isArchived) throw ApiError.forbidden('Your account has been deactivated.');
  assertApproved(user);

  if (user.changedPasswordAfter(decoded.iat)) {
    throw ApiError.unauthorized('Password was recently changed. Please log in again.');
  }

  req.user = user;
  next();
});

/** Attaches req.user if a valid token is present, but never rejects the request. */
const optionalAuth = catchAsync(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.isActive && !user.isArchived && user.approvalStatus === 'approved') req.user = user;
  } catch {
    // ignore invalid token for optional auth
  }
  next();
});

module.exports = { protect, optionalAuth, assertApproved };

const jwt = require('jsonwebtoken');

const generateAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES,
  });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES,
  });

const generateEmailToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_EMAIL_SECRET, { expiresIn: '1d' });

const generateResetToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_RESET_SECRET, { expiresIn: '1h' });

/** Issues the access/refresh pair and sets the refresh token as an httpOnly cookie. */
const issueAuthTokens = (res, user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth',
  });

  return accessToken;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateEmailToken,
  generateResetToken,
  issueAuthTokens,
};

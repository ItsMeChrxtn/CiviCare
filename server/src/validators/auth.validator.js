const { body } = require('express-validator');

const registerValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^09\d{9}$/)
    .withMessage('Phone must be a valid PH mobile number (e.g. 09171234567)'),
];

const loginValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const verifyOtpValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('A valid 6-digit code is required'),
];

const resendVerificationValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
];

const forgotPasswordValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

module.exports = {
  registerValidator,
  loginValidator,
  verifyOtpValidator,
  resendVerificationValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
};

const { body } = require('express-validator');

const registerValidator = [
  body('fullName')
    .if(body('firstName').not().exists())
    .trim()
    .isLength({ min: 3 })
    .withMessage('Full name is required'),
  body('firstName').if(body('fullName').not().exists()).trim().notEmpty().withMessage('First name is required'),
  body('lastName').if(body('fullName').not().exists()).trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^09\d{9}$/)
    .withMessage('Phone must be a valid PH mobile number (e.g. 09171234567)'),
  body('gender').optional({ checkFalsy: true }).isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('civilStatus')
    .optional({ checkFalsy: true })
    .isIn(['single', 'married', 'widowed', 'separated', 'divorced'])
    .withMessage('Invalid civil status'),
  body('birthdate').optional({ checkFalsy: true }).isISO8601().withMessage('Birth date must be a valid date'),
  body('residencySince').optional({ checkFalsy: true }).isISO8601().withMessage('Date of residency must be a valid date'),
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

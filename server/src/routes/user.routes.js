const express = require('express');
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const { restrictTo, requireSuperAdmin } = require('../middleware/role');
const upload = require('../middleware/upload');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

// Self-service
router.patch('/me', userController.updateMe);
router.patch('/me/avatar', upload.single('avatar'), userController.uploadAvatar);
router.patch('/me/valid-id', upload.single('validId'), userController.uploadValidId);

// Admin / Official management
router.get('/stats/overview', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), userController.getUserStats);
router.get('/', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), userController.getAllUsers);
router.post('/', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), userController.createUser);
router.get('/:id', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), userController.getUser);
router.patch('/:id', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), userController.updateUser);
// Panel revision: admins can correct a resident's name and email or set a new password.
router.patch(
  '/:id/account',
  restrictTo(ROLES.ADMIN),
  [
    body('firstName').optional().trim().notEmpty().withMessage('First name is required'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name is required'),
    body('email').optional().isEmail().withMessage('Enter a valid email address'),
    body('password').optional({ values: 'falsy' }).isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  userController.updateAccount
);
router.patch('/:id/verify', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), userController.verifyResident);
router.patch('/:id/approval', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), userController.reviewRegistration);
router.patch('/:id/toggle-active', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), userController.toggleActive);
router.patch('/:id/archive', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), userController.archiveUser);
// Panel revision: only the super admin can unarchive residents/users.
router.patch('/:id/restore', requireSuperAdmin, userController.restoreUser);
router.delete('/:id', restrictTo(ROLES.ADMIN), userController.deleteUser);

module.exports = router;

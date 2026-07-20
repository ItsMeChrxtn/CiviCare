const express = require('express');
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const upload = require('../middleware/upload');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

// Self-service
router.patch('/me', userController.updateMe);
router.patch('/me/avatar', upload.single('avatar'), userController.uploadAvatar);
router.patch('/me/valid-id', upload.single('validId'), userController.uploadValidId);
router.get('/me/qrcode', userController.getMyQrCode);

// Admin / Official management
router.get('/stats/overview', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), userController.getUserStats);
router.get('/', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), userController.getAllUsers);
router.post('/', restrictTo(ROLES.ADMIN), userController.createUser);
router.get('/:id', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), userController.getUser);
router.patch('/:id', restrictTo(ROLES.ADMIN), userController.updateUser);
router.patch('/:id/toggle-active', restrictTo(ROLES.ADMIN), userController.toggleActive);
router.patch('/:id/archive', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), userController.archiveUser);
router.patch('/:id/restore', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), userController.restoreUser);
router.delete('/:id', restrictTo(ROLES.ADMIN), userController.deleteUser);

module.exports = router;

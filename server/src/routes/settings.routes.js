const express = require('express');
const settingsController = require('../controllers/settings.controller');
const { protect, optionalAuth } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = express.Router();

// Publicly readable (general info, FAQs, categories power public pages/forms)
router.get('/:key', optionalAuth, settingsController.getSetting);

// Officials keep the Emergency Hub alert levels current without needing full admin settings access.
router.put('/emergency', protect, restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), settingsController.updateEmergencyStatus);

router.use(protect, restrictTo(ROLES.ADMIN));
router.get('/', settingsController.getAllSettings);
router.put('/:key', settingsController.updateSetting);
router.get('/backup/export', settingsController.exportBackup);
router.post('/backup/restore', settingsController.restoreBackup);
router.get('/backup/auto', settingsController.getAutoBackups);
router.post('/backup/auto', settingsController.runBackupNow);
router.get('/backup/auto/:name', settingsController.downloadAutoBackup);

module.exports = router;

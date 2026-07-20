const express = require('express');
const announcementController = require('../controllers/announcement.controller');
const { protect, optionalAuth } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const upload = require('../middleware/upload');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', optionalAuth, announcementController.getAllAnnouncements);
router.get('/:id', optionalAuth, announcementController.getAnnouncement);

router.use(protect, restrictTo(ROLES.ADMIN, ROLES.OFFICIAL));
router.post('/', upload.single('coverImage'), announcementController.createAnnouncement);
router.patch('/:id', upload.single('coverImage'), announcementController.updateAnnouncement);
router.patch('/:id/archive', announcementController.archiveAnnouncement);
router.patch('/:id/restore', announcementController.restoreAnnouncement);

module.exports = router;

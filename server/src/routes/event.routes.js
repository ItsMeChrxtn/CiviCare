const express = require('express');
const eventController = require('../controllers/event.controller');
const { protect, optionalAuth } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const upload = require('../middleware/upload');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', optionalAuth, eventController.getAllEvents);
router.get('/:id', optionalAuth, eventController.getEvent);

router.use(protect);

router.post('/:id/join', restrictTo(ROLES.RESIDENT), eventController.joinEvent);
router.delete('/:id/join', restrictTo(ROLES.RESIDENT), eventController.leaveEvent);
router.post('/:id/certificate', restrictTo(ROLES.RESIDENT), eventController.issueCertificate);

router.get('/:id/participants', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), eventController.getParticipants);
router.post('/:id/checkin', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), eventController.checkInAttendance);

router.post('/', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), upload.single('coverImage'), eventController.createEvent);
router.patch('/:id', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), upload.single('coverImage'), eventController.updateEvent);
router.patch(
  '/:id/gallery',
  restrictTo(ROLES.ADMIN, ROLES.OFFICIAL),
  upload.array('images', 10),
  eventController.addGalleryImages
);
router.patch('/:id/archive', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), eventController.archiveEvent);
router.patch('/:id/restore', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), eventController.restoreEvent);

module.exports = router;

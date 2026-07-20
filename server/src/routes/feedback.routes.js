const express = require('express');
const feedbackController = require('../controllers/feedback.controller');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.post('/', restrictTo(ROLES.RESIDENT), feedbackController.createFeedback);
router.get('/', feedbackController.getAllFeedback);
router.patch('/:id/respond', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), feedbackController.respondToFeedback);
router.patch('/:id/archive', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), feedbackController.archiveFeedback);
router.patch('/:id/restore', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), feedbackController.restoreFeedback);

module.exports = router;

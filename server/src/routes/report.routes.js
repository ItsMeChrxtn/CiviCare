const express = require('express');
const reportController = require('../controllers/report.controller');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/public-stats', reportController.getPublicStats);

router.use(protect, restrictTo(ROLES.ADMIN, ROLES.OFFICIAL));

router.get('/overview', reportController.getOverview);
router.get('/events', reportController.getEventStats);
router.get('/trends', reportController.getTrends);
router.get('/export/:format', reportController.exportReport); // excel | csv | pdf

module.exports = router;

const express = require('express');
const reportController = require('../controllers/report.controller');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect, restrictTo(ROLES.ADMIN, ROLES.OFFICIAL));

router.get('/overview', reportController.getOverview);
router.get('/trends', reportController.getTrends);
router.get('/export/excel', reportController.exportExcel);

module.exports = router;

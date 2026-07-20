const express = require('express');
const logController = require('../controllers/log.controller');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/', restrictTo(ROLES.ADMIN), logController.getAllLogs);
router.get('/archives', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), logController.getAllArchives);

module.exports = router;

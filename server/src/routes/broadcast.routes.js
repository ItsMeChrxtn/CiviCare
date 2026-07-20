const express = require('express');
const broadcastController = require('../controllers/broadcast.controller');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect, restrictTo(ROLES.ADMIN, ROLES.OFFICIAL));
router.post('/', broadcastController.sendBroadcast);

module.exports = router;

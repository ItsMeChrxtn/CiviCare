const express = require('express');
const hazardController = require('../controllers/hazard.controller');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', hazardController.getAllHazards);
router.get('/:id', hazardController.getHazard);

router.use(protect, restrictTo(ROLES.ADMIN, ROLES.OFFICIAL));
router.post('/', hazardController.createHazard);
router.patch('/:id', hazardController.updateHazard);
router.patch('/:id/archive', hazardController.archiveHazard);
router.patch('/:id/restore', hazardController.restoreHazard);

module.exports = router;

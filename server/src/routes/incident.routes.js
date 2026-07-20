const express = require('express');
const incidentController = require('../controllers/incident.controller');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { createIncidentValidator } = require('../validators/incident.validator');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/map', incidentController.getIncidentsForMap);
router.get('/stats/overview', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), incidentController.getIncidentStats);

router.post('/', upload.array('images', 5), createIncidentValidator, validate, incidentController.createIncident);
router.get('/', incidentController.getAllIncidents);
router.get('/:id', incidentController.getIncident);

router.patch('/:id/assign', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), incidentController.assignIncident);
router.patch('/:id/status', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), incidentController.updateIncidentStatus);
router.patch('/:id/archive', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), incidentController.archiveIncident);
router.patch('/:id/restore', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), incidentController.restoreIncident);

module.exports = router;

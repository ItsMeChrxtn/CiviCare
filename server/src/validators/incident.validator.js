const { body } = require('express-validator');
const { INCIDENT_CATEGORY, INCIDENT_SEVERITY } = require('../config/constants');

const createIncidentValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(Object.values(INCIDENT_CATEGORY)).withMessage('Invalid category'),
  body('severity').isIn(Object.values(INCIDENT_SEVERITY)).withMessage('Invalid severity'),
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
];

module.exports = { createIncidentValidator };

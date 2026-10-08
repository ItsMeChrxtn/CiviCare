const { body } = require('express-validator');
const { INCIDENT_CATEGORY, INCIDENT_SEVERITY } = require('../config/constants');

const createIncidentValidator = [
  // Title/description are optional: the button-based report screen only needs a category, priority and pin.
  body('title').optional().trim().isLength({ max: 150 }).withMessage('Title is too long'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description is too long'),
  body('category').isIn(Object.values(INCIDENT_CATEGORY)).withMessage('Invalid category'),
  body('severity').isIn(Object.values(INCIDENT_SEVERITY)).withMessage('Invalid severity'),
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
];

module.exports = { createIncidentValidator };

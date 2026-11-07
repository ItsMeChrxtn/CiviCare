const { body } = require('express-validator');
const { INCIDENT_CATEGORY, isInsideMagdiwang } = require('../config/constants');

const createIncidentValidator = [
  body('title').optional().trim().isLength({ max: 150 }).withMessage('Title is too long'),
  // Panel revision: a description of what happened is required.
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Please describe the incident (at least 10 characters).'),
  body('category').isIn(Object.values(INCIDENT_CATEGORY)).withMessage('Invalid category'),
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  // Panel revision: reports are limited to Barangay Magdiwang.
  body('lat')
    .custom((lat, { req }) => isInsideMagdiwang(Number(lat), Number(req.body.lng)))
    .withMessage('The pinned location is outside Barangay Magdiwang. Please pin a location inside the barangay.'),
];

module.exports = { createIncidentValidator };

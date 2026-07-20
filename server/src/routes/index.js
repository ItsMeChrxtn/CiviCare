const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/incidents', require('./incident.routes'));
router.use('/announcements', require('./announcement.routes'));
router.use('/events', require('./event.routes'));
router.use('/donations', require('./donation.routes'));
router.use('/documents', require('./document.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/feedback', require('./feedback.routes'));
router.use('/hazards', require('./hazard.routes'));
router.use('/chatbot', require('./chatbot.routes'));
router.use('/hotlines', require('./hotline.routes'));
router.use('/roles', require('./role.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/logs', require('./log.routes'));
router.use('/reports', require('./report.routes'));
router.use('/broadcast', require('./broadcast.routes'));

router.get('/health', (_req, res) => res.status(200).json({ success: true, message: 'CiviCare API is running' }));

module.exports = router;

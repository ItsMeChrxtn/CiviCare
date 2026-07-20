const express = require('express');
const documentController = require('../controllers/document.controller');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/verify/:referenceCode', documentController.verifyDocument); // public QR verification

router.use(protect);

router.get('/stats/overview', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), documentController.getDocumentStats);
router.post('/', restrictTo(ROLES.RESIDENT), documentController.createDocumentRequest);
router.get('/', documentController.getAllDocuments);
router.get('/:id', documentController.getDocument);
router.patch('/:id/review', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), documentController.reviewDocument);
router.patch('/:id/claim', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), documentController.markClaimed);
router.patch('/:id/archive', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), documentController.archiveDocumentRequest);
router.patch('/:id/restore', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), documentController.restoreDocumentRequest);

module.exports = router;

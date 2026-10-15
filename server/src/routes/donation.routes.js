const express = require('express');
const donationController = require('../controllers/donation.controller');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const upload = require('../middleware/upload');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/stats/overview', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), donationController.getDonationStats);
router.post('/', restrictTo(ROLES.RESIDENT), upload.single('proofImage'), donationController.createDonation);
router.get('/', donationController.getAllDonations);
router.get('/:id', donationController.getDonation);
router.patch('/:id/status', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), donationController.updateDonationStatus);
router.patch('/:id/archive', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), donationController.archiveDonation);
router.patch('/:id/restore', restrictTo(ROLES.ADMIN, ROLES.OFFICIAL), donationController.restoreDonation);

module.exports = router;

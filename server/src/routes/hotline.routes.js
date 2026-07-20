const express = require('express');
const Hotline = require('../models/Hotline');
const factory = require('../controllers/handlerFactory');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = express.Router();

// Public - powers the Emergency Hub hotline directory
router.get('/', factory.getAll(Hotline, { searchFields: ['name', 'number'] }));
router.get('/:id', factory.getOne(Hotline));

router.use(protect, restrictTo(ROLES.ADMIN, ROLES.OFFICIAL));
router.post('/', factory.createOne(Hotline));
router.patch('/:id', factory.updateOne(Hotline));
router.delete('/:id', factory.deleteOne(Hotline));

module.exports = router;

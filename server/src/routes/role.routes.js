const express = require('express');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const factory = require('../controllers/handlerFactory');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect, restrictTo(ROLES.ADMIN));

// Permissions (mostly seeded, read + label edits only)
router.get('/permissions', factory.getAll(Permission, { searchFields: ['key', 'label'] }));
router.post('/permissions', factory.createOne(Permission));
router.patch('/permissions/:id', factory.updateOne(Permission));
router.delete('/permissions/:id', factory.deleteOne(Permission));

// Custom roles
router.get('/', factory.getAll(Role, { searchFields: ['name'], populate: 'permissions' }));
router.get('/:id', factory.getOne(Role, { populate: 'permissions' }));
router.post('/', factory.createOne(Role));
router.patch('/:id', factory.updateOne(Role));
router.delete('/:id', factory.deleteOne(Role));

module.exports = router;

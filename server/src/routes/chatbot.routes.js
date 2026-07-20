const express = require('express');
const chatbotController = require('../controllers/chatbot.controller');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/menu', chatbotController.getMenu);
router.get('/node/:id', chatbotController.getNode);

router.use(protect, restrictTo(ROLES.ADMIN));
router.get('/admin/all', chatbotController.getAllNodes);
router.post('/', chatbotController.createNode);
router.patch('/:id', chatbotController.updateNode);
router.delete('/:id', chatbotController.deleteNode);

module.exports = router;

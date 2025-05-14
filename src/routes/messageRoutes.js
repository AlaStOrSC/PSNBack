const express = require('express');
const router = express.Router();
const { getConversations, getMessages } = require('../controllers/messageController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/conversations', authMiddleware(), getConversations);
router.get('/:userId', authMiddleware(), getMessages);

module.exports = router;
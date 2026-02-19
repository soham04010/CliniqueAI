const express = require('express');
const router = express.Router();
const { getChatHistory, deleteChatHistory, markMessagesAsRead } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/:userId/:otherId', protect, getChatHistory);
router.delete('/:userId/:otherId', protect, deleteChatHistory);
router.put('/mark-read/:otherId', protect, markMessagesAsRead);

module.exports = router;
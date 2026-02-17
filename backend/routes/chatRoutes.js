const express = require('express');
const router = express.Router();
const { getChatHistory, deleteChatHistory } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/:userId/:otherId', protect, getChatHistory);
router.delete('/:userId/:otherId', protect, deleteChatHistory);

module.exports = router;
const Notification = require('../models/Notification');

// @desc    Get Notifications for User
const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const notifications = await Notification.find({ recipientId: userId })
            .sort({ createdAt: -1 })
            .limit(20); // Limit to last 20

        // Count unread
        const unreadCount = await Notification.countDocuments({ recipientId: userId, read: false });

        res.json({ notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark Notification as Read
const markRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndUpdate(id, { read: true });
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark All as Read
const markAllRead = async (req, res) => {
    try {
        const userId = req.user._id;
        await Notification.updateMany({ recipientId: userId, read: false }, { read: true });
        res.json({ message: 'All marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getNotifications,
    markRead,
    markAllRead
};

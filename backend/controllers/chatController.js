const Message = require('../models/Message');

const getChatHistory = async (req, res) => {
  const { userId, otherId } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherId },
        { senderId: otherId, receiverId: userId }
      ],
      deletedBy: { $ne: userId } // Exclude messages deleted by this user
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteChatHistory = async (req, res) => {
  const { userId, otherId } = req.params;
  try {
    await Message.updateMany(
      {
        $or: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId }
        ]
      },
      { $addToSet: { deletedBy: userId } }
    );
    res.json({ message: "Chat history deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getChatHistory, deleteChatHistory };
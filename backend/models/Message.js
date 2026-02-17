const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Array of user IDs who deleted this message
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
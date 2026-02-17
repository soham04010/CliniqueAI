const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['VITAL_CHECK', 'MESSAGE', 'ALERT'],
        default: 'VITAL_CHECK'
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    data: {
        patientId: { type: mongoose.Schema.Types.ObjectId },
        recordId: { type: mongoose.Schema.Types.ObjectId }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);

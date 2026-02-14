const mongoose = require('mongoose');

const CoPilotChatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The Doctor
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientData', required: false }, // Context (Optional if general query)
    messages: [
        {
            role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
            content: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

// efficient indexing
CoPilotChatSchema.index({ userId: 1, patientId: 1 });

module.exports = mongoose.model('CoPilotChat', CoPilotChatSchema);

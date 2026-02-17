const mongoose = require('mongoose');

const PatientDataSchema = new mongoose.Schema({
  // Make doctor_id OPTIONAL, add patient_id
  doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Link to Patient Account
  name: { type: String, required: true },
  email: { type: String, required: false }, // Direct contact info
  phone: { type: String, required: false }, // Direct contact info

  inputs: {
    gender: { type: Number, required: true }, // 1 = Male, 0 = Female
    age: { type: Number, required: true },
    hypertension: { type: Number, required: true },
    heart_disease: { type: Number, required: true },
    bmi: { type: Number, required: true },
    HbA1c_level: { type: Number, required: true },
    blood_glucose_level: { type: Number, required: true },
    // One-Hot Encoded Smoking History
    smoking_history_current: { type: Number, default: 0 },
    smoking_history_ever: { type: Number, default: 0 },
    smoking_history_former: { type: Number, default: 0 },
    smoking_history_never: { type: Number, default: 0 },
    "smoking_history_not current": { type: Number, default: 0 }
  },

  prediction: {
    riskScore: Number,
    riskLevel: String,
    timestamp: { type: Date, default: Date.now },
    confidenceScore: Number,
    confidenceLabel: String
  }
}, { timestamps: true });

module.exports = mongoose.model('PatientData', PatientDataSchema);
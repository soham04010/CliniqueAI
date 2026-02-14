const mongoose = require('mongoose');

const PatientDataSchema = new mongoose.Schema({
  // Make doctor_id OPTIONAL, add patient_id
  doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Link to Patient Account
  name: { type: String, required: true },
  
  inputs: {
    gender: { type: String, required: true },
    age: { type: Number, required: true },
    hypertension: { type: Number, required: true },
    heart_disease: { type: Number, required: true },
    smoking_history: { type: String, required: true },
    bmi: { type: Number, required: true },
    HbA1c_level: { type: Number, required: true },
    blood_glucose_level: { type: Number, required: true }
  },

  prediction: {
    riskScore: Number,
    riskLevel: String,
    timestamp: { type: Date, default: Date.now }
  }
}, { timestamps: true });

module.exports = mongoose.model('PatientData', PatientDataSchema);
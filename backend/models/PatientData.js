const mongoose = require('mongoose');

const patientDataSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to Patient User
  vitals: {
    age: Number,
    bmi: Number,
    glucose: Number,
    bp_systolic: Number,
    bp_diastolic: Number,
    heartRate: Number
  },
  aiAnalysis: {
    riskScore: Number, // 0-100
    riskLevel: String, // "Low", "Moderate", "High"
    confidence: Number, // e.g., 0.95
    factors: [String] // ["High BMI", "Elevated Glucose"]
  },
  doctorNotes: String
}, { timestamps: true });

module.exports = mongoose.model('PatientData', patientDataSchema);
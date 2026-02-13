const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: Number,
  gender: String,
  history: [String], // e.g., ["Diabetes", "Hypertension"]
  // This array stores their health over time (The "Longitudinal" part)
  records: [{
    date: { type: Date, default: Date.now },
    vitals: {
      bmi: Number,
      glucose: Number,
      bp: String, // "120/80"
      heartRate: Number
    },
    riskAnalysis: {
      score: Number, // 0-100
      riskLevel: String, // "Low", "Medium", "High"
      factors: [String] // "High Glucose", "Obesity"
    }
  }]
});

module.exports = mongoose.model('Patient', PatientSchema);
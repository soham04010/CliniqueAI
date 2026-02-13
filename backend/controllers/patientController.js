const PatientData = require('../models/PatientData');
const User = require('../models/User');

// @desc    Get all patients (Doctor only)
// @route   GET /api/patients
const getPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' }).select('-password');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add Medical Record & Get AI Risk Score
// @route   POST /api/patients/record
const addRecord = async (req, res) => {
  const { userId, vitals } = req.body;

  try {
    // --- MOCK AI LOGIC (Replace this with friend's Python API call later) ---
    // Rule-based logic for now:
    let score = 10;
    let factors = [];

    if (vitals.bmi > 25) { score += 20; factors.push('Overweight'); }
    if (vitals.glucose > 100) { score += 30; factors.push('High Glucose'); }
    if (vitals.age > 50) { score += 15; factors.push('Age Factor'); }
    
    // Cap score at 100
    if (score > 95) score = 95;

    let riskLevel = "Low";
    if (score > 30) riskLevel = "Moderate";
    if (score > 60) riskLevel = "High";
    // -----------------------------------------------------------------------

    const newRecord = await PatientData.create({
      user: userId,
      vitals,
      aiAnalysis: {
        riskScore: score,
        riskLevel: riskLevel,
        confidence: 0.88, // Mock confidence
        factors: factors
      }
    });

    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get History for a specific patient
// @route   GET /api/patients/:id/history
const getPatientHistory = async (req, res) => {
  try {
    const history = await PatientData.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPatients, addRecord, getPatientHistory };
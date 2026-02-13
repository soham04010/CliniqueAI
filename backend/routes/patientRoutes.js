const express = require('express');
const router = express.Router();
const Patient = require('../models/PatientData');

// GET all patients (For Doctor Dashboard)
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new patient record (Simulates AI Processing)
router.post('/add-record/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    const { vitals } = req.body;

    // --- MOCK AI LOGIC (Replace this with your friend's Python API later) ---
    // If glucose > 120, risk is High. This is just for the Hackathon demo!
    let riskScore = vitals.glucose > 120 ? 85 : 20;
    let riskLevel = riskScore > 50 ? "High" : "Low";
    // -----------------------------------------------------------------------

    const newRecord = {
      vitals,
      riskAnalysis: {
        score: riskScore,
        riskLevel,
        factors: riskScore > 50 ? ["High Glucose"] : []
      }
    };

    patient.records.push(newRecord);
    await patient.save();
    res.json(patient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
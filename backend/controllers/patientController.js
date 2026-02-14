const axios = require('axios');
const PatientData = require('../models/PatientData');

// @desc    Predict Risk
const predictRisk = async (req, res) => {
  const { name, inputs } = req.body; 
  const userId = req.user._id;
  const userRole = req.user.role;

  try {
    // 1. AI Prediction
    let aiResult = { riskScore: 0, riskLevel: "Unknown" };
    try {
      const response = await axios.post('http://127.0.0.1:8000/predict', inputs);
      aiResult = {
        riskScore: response.data.risk_score,
        riskLevel: response.data.risk_level
      };
    } catch (pyError) {
      console.error("⚠️ AI Service Error:", pyError.message);
      let roughScore = 15;
      if (inputs.blood_glucose_level > 200) roughScore += 50;
      aiResult = { riskScore: roughScore, riskLevel: roughScore > 50 ? "High" : "Low" };
    }

    // 2. Save Record
    const recordData = {
      name,
      inputs,
      prediction: aiResult
    };

    if (userRole === 'doctor') {
      recordData.doctor_id = userId;
    } else {
      recordData.patient_id = userId;
    }

    const newRecord = await PatientData.create(recordData);
    res.status(201).json(newRecord);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Single Assessment by ID
const getPatientById = async (req, res) => {
  try {
    const patient = await PatientData.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Record not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Full History by Patient Name (Longitudinal Tracking)
const getPatientHistory = async (req, res) => {
  const { name } = req.params;
  try {
    // Find all records with this name, sorted by date (Oldest -> Newest)
    const history = await PatientData.find({ name: decodeURIComponent(name) })
      .sort({ createdAt: 1 })
      .select('prediction.riskScore createdAt inputs');
      
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Recent Patients List
const getPatients = async (req, res) => {
  try {
    const query = req.user.role === 'doctor' ? { doctor_id: req.user._id } : { patient_id: req.user._id };
    const patients = await PatientData.find(query).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Simulate Risk
const simulateRisk = async (req, res) => {
  const { inputs } = req.body; 
  try {
    const response = await axios.post('http://127.0.0.1:8000/predict', inputs);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(200).json({ riskScore: 0, riskLevel: "Error" });
  }
};

module.exports = { predictRisk, getPatients, getPatientById, getPatientHistory, simulateRisk };
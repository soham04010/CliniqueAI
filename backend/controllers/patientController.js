const axios = require('axios');
const PatientData = require('../models/PatientData');
const CoPilotChat = require('../models/CoPilotChat');
const mongoose = require('mongoose');
// @desc    Predict Risk
const predictRisk = async (req, res) => {
  const { name, inputs, doctor_id } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  try {
    // 1. AI Prediction
    let aiResult = { riskScore: 0, riskLevel: "Unknown" };
    try {
      const aiUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';
      const response = await axios.post(`${aiUrl}/predict`, inputs);
      aiResult = {
        riskScore: response.data.risk_score || (response.data.probability * 100),
        riskLevel: response.data.risk_level,
        confidenceScore: response.data.confidence_score,
        confidenceLabel: response.data.confidence_label
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
      if (doctor_id) recordData.doctor_id = doctor_id;
    }

    const newRecord = await PatientData.create(recordData);
    res.status(201).json(newRecord);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get All Patients (Using YOUR Unique List logic)
const getPatients = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Ensure the ID is a proper MongoDB ObjectId for aggregation
    const searchId = new mongoose.Types.ObjectId(userId);

    const patients = await PatientData.aggregate([
      {
        $match: userRole === 'doctor'
          ? { doctor_id: searchId }
          : { patient_id: searchId }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$name", // Collapse all records with the same name
          latestRecord: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$latestRecord" } },
      { $sort: { createdAt: -1 } }
    ]);

    res.json(patients);
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

// @desc    Get Full History by Patient Name (For Charting)
const getPatientHistory = async (req, res) => {
  const { name } = req.params;
  try {
    const history = await PatientData.find({ name: decodeURIComponent(name) })
      .sort({ createdAt: 1 })
      .select('prediction.riskScore createdAt inputs');
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Simulate Risk
const simulateRisk = async (req, res) => {
  const { inputs } = req.body;
  try {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';
    const response = await axios.post(`${aiUrl}/predict`, inputs);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(200).json({ risk_score: 0, risk_level: "Error" });
  }
};

// @desc    CoPilot AI Chat Logic (From Friend's code)
const copilotRequest = async (req, res) => {
  const { message, context } = req.body;
  const userId = req.user._id;
  const patientId = context._id || context.id;

  try {
    // 1. Fetch Patient History if Name is available
    if (context.name) {
      const history = await PatientData.find({ name: context.name })
        .sort({ createdAt: 1 })
        .limit(10)
        .select('prediction.riskScore createdAt inputs');

      context.history = history;
    }

    // 2. Forward to Python AI Service
    // Pass user role (doctor/patient) to enable persona switching
    const role = req.user.role || 'patient';
    const aiUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';
    const response = await axios.post(`${aiUrl}/copilot`, { message, context, role });
    const aiReply = response.data.reply;

    // 3. Save Chat History if Patient Context Exists
    if (patientId) {
      let chat = await CoPilotChat.findOne({ userId, patientId });

      if (!chat) {
        chat = new CoPilotChat({ userId, patientId, messages: [] });
      }

      chat.messages.push({ role: 'user', content: message });
      chat.messages.push({ role: 'assistant', content: aiReply });

      await chat.save();
    }

    res.status(200).json(response.data);
  } catch (error) {
    console.error("AI Service Error:", error.message);
    res.status(500).json({ reply: "I'm having trouble connecting to my clinical brain right now." });
  }
};

// @desc    Get Chat History (From Friend's code)
const getCoPilotHistory = async (req, res) => {
  const { patientId } = req.params;
  const userId = req.user._id;

  try {
    const chat = await CoPilotChat.findOne({ userId, patientId });
    if (!chat) return res.json([]);
    res.json(chat.messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to load history" });
  }
};

// @desc    Delete Patient Records (From Your code)
const deletePatient = async (req, res) => {
  try {
    const { name } = req.params;
    await PatientData.deleteMany({
      name: decodeURIComponent(name),
      doctor_id: req.user._id
    });
    res.json({ message: "Patient history deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  predictRisk,
  getPatients,
  getPatientById,
  getPatientHistory,
  simulateRisk,
  copilotRequest,
  getCoPilotHistory,
  deletePatient
};
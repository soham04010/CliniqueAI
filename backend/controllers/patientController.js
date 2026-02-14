const axios = require('axios');
const PatientData = require('../models/PatientData');
const CoPilotChat = require('../models/CoPilotChat'); // Import CoPilot Chat Model

// @desc    Predict Risk
const predictRisk = async (req, res) => {
  // Added doctor_id to destructuring
  const { name, inputs, doctor_id } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  try {
    // 1. AI Prediction
    let aiResult = { riskScore: 0, riskLevel: "Unknown" };
    try {
      const response = await axios.post('http://127.0.0.1:5001/predict', inputs);
      aiResult = {
        riskScore: response.data.risk_score || (response.data.probability * 100),
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
      // Link the record to the selected doctor if provided by the patient
      if (doctor_id) recordData.doctor_id = doctor_id;
    }

    const newRecord = await PatientData.create(recordData);
    res.status(201).json(newRecord);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ... Rest of the functions (getPatientById, getPatientHistory, getPatients, simulateRisk) 
// remain EXACTLY as per your provided code.
const getPatientById = async (req, res) => {
  try {
    const patient = await PatientData.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Record not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

const getPatients = async (req, res) => {
  try {
    const query = req.user.role === 'doctor' ? { doctor_id: req.user._id } : { patient_id: req.user._id };
    const patients = await PatientData.find(query).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const simulateRisk = async (req, res) => {
  const { inputs } = req.body;
  try {
    const response = await axios.post('http://127.0.0.1:5001/predict', inputs);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(200).json({ risk_score: 0, risk_level: "Error" });
  }
};

const copilotRequest = async (req, res) => {
  const { message, context } = req.body;
  const userId = req.user._id;
  const patientId = context._id || context.id; // Try to extract patient ID if available

  try {
    // 1. Fetch Patient History if Name is available
    if (context.name) {
      const history = await PatientData.find({ name: context.name })
        .sort({ createdAt: 1 })
        .limit(10) // Get last 10 records for trend analysis
        .select('prediction.riskScore createdAt inputs');

      context.history = history;
    }

    // 2. Forward to Python AI Service
    const response = await axios.post('http://127.0.0.1:5001/copilot', { message, context });
    const aiReply = response.data.reply;

    // 2. Save Chat History if Patient Context Exists
    if (patientId) {
      // Find existing chat or create new
      let chat = await CoPilotChat.findOne({ userId, patientId });

      if (!chat) {
        chat = new CoPilotChat({ userId, patientId, messages: [] });
      }

      // Add User Message
      chat.messages.push({ role: 'user', content: message });
      // Add AI Response
      chat.messages.push({ role: 'assistant', content: aiReply });

      await chat.save();
    }

    res.status(200).json(response.data);
  } catch (error) {
    console.error("AI Service Error:", error.message);
    res.status(500).json({ reply: "I'm having trouble connecting to my clinical brain right now." });
  }
};

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

module.exports = { predictRisk, getPatients, getPatientById, getPatientHistory, simulateRisk, copilotRequest, getCoPilotHistory };
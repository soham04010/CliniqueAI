const axios = require('axios');
const PatientData = require('../models/PatientData');
const CoPilotChat = require('../models/CoPilotChat');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Helper function to format frontend inputs for Python AI
const formatInputsForAI = (rawInputs) => {
  return {
    gender: rawInputs.gender === 'Male' ? 1 : 0,
    age: Number(rawInputs.age),
    hypertension: Number(rawInputs.hypertension),
    heart_disease: Number(rawInputs.heart_disease),
    bmi: Number(rawInputs.bmi),
    HbA1c_level: Number(rawInputs.HbA1c_level),
    blood_glucose_level: Number(rawInputs.blood_glucose_level),
    // One-Hot Encode Smoking History
    smoking_history_current: rawInputs.smoking_history === 'current' ? 1 : 0,
    smoking_history_ever: rawInputs.smoking_history === 'ever' ? 1 : 0,
    smoking_history_former: rawInputs.smoking_history === 'former' ? 1 : 0,
    smoking_history_never: rawInputs.smoking_history === 'never' ? 1 : 0,
    "smoking_history_not current": rawInputs.smoking_history === 'not current' ? 1 : 0,
  };
};

// @desc    Predict Risk
const predictRisk = async (req, res) => {
  const { name, inputs, doctor_id } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  try {
    // 1. Format Inputs for AI
    const formattedInputs = formatInputsForAI(inputs);

    // 2. AI Prediction
    let aiResult = { riskScore: 0, riskLevel: "Unknown" };
    try {
      const aiUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';
      console.log(`🔗 Sending Predict request to AI:`, formattedInputs);
      const response = await axios.post(`${aiUrl}/predict`, formattedInputs);
      aiResult = {
        riskScore: response.data.risk_score || (response.data.probability * 100),
        riskLevel: response.data.risk_level,
        confidenceScore: response.data.confidence_score,
        confidenceLabel: response.data.confidence_label
      };
    } catch (pyError) {
      console.error("⚠️ AI Service Error in predictRisk:", pyError.message);
      let roughScore = 15;
      if (inputs.blood_glucose_level > 200) roughScore += 50;
      aiResult = { riskScore: roughScore, riskLevel: roughScore > 50 ? "High" : "Low" };
    }

    // 3. Save Record (Save the original raw inputs, not the formatted ones, for the frontend display)
    const recordData = {
      name,
      inputs: inputs,
      prediction: aiResult
    };

    if (userRole === 'doctor') {
      recordData.doctor_id = userId;

      // Attempt to link to Patient Account
      console.log(`🔗 Doctor linking to patient_id: ${req.body.patient_id || 'NONE'}`);
      if (req.body.patient_id) {
        recordData.patient_id = req.body.patient_id;
      } else if (req.body.email) {
        const User = require('../models/User'); // Import dynamically
        const patientUser = await User.findOne({ email: req.body.email });

        if (!patientUser) {
          return res.status(404).json({ message: "Patient account with this email not found. Please ask patient to register first." });
        }

        recordData.patient_id = patientUser._id;
        console.log(`🔗 Linked assessment to Patient account: ${patientUser.email}`);
      }
    } else {
      recordData.patient_id = userId;

      // Patient assigning their doctor
      if (req.body.doctor_email) {
        const User = require('../models/User');
        const doctorUser = await User.findOne({ email: req.body.doctor_email, role: 'doctor' });

        if (doctorUser) {
          recordData.doctor_id = doctorUser._id;
          console.log(`🔗 Patient [${name}] linked to Doctor [${doctorUser.name}]`);

          // Persist the link in the Patient's User profile
          await User.findByIdAndUpdate(userId, { primaryDoctorId: doctorUser._id });
          console.log(`💾 Persisted Primary Doctor [${doctorUser.email}] for Patient [${userId}]`);
        } else {
          console.warn(`⚠️ Doctor email not found: ${req.body.doctor_email}`);
        }
      } else if (doctor_id) {
        recordData.doctor_id = doctor_id; // Legacy/Fallback
      } else {
        // Fallback: Check if patient already has a primary doctor
        const User = require('../models/User');
        const patientUser = await User.findById(userId);
        if (patientUser && patientUser.primaryDoctorId) {
          recordData.doctor_id = patientUser.primaryDoctorId;
          console.log(`🔗 Auto-linked to existing Primary Doctor for record.`);
        }
      }
    }

    const newRecord = await PatientData.create(recordData);

    // 4. Create Notification for Doctor
    console.log("🔍 CHECKING NOTIFICATION LOGIC:");
    console.log(" - Doctor ID:", recordData.doctor_id);
    console.log(" - User Role:", userRole);

    if (recordData.doctor_id && userRole === 'patient') {
      try {
        console.log("✨ ATTEMPTING TO CREATE NOTIFICATION for:", recordData.doctor_id);
        const notif = await Notification.create({
          recipientId: new mongoose.Types.ObjectId(String(recordData.doctor_id)), // Explicit Cast
          senderId: userId,
          senderName: name,
          type: 'VITAL_CHECK',
          message: `${name} has shared a new Routine Vital Check.`,
          data: {
            patientId: userId,
            recordId: newRecord._id
          }
        });
        console.log("✅ NOTIFICATION CREATED:", notif._id);
      } catch (notifError) {
        console.error("❌ Notification Error:", notifError);
      }
    } else {
      console.log("⚠️ SKIPPING NOTIFICATION: Conditions not met.");
    }

    res.status(201).json(newRecord);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get All Patients
const getPatients = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
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
          _id: "$name",
          latestRecord: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$latestRecord" } },
      {
        $lookup: {
          from: "users",
          localField: "patient_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          email: "$userDetails.email",
          phone: "$userDetails.phone"
        }
      },
      {
        $project: {
          userDetails: 0
        }
      },
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
    console.log(`🔎 GET /patients/${req.params.id} requested by ${req.user.name}`);

    let patient;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      patient = await PatientData.findById(req.params.id).lean();

      if (!patient) {
        console.log(`⚠️ Record ID not found. Trying lookup by patient_id: ${req.params.id}`);
        const latest = await PatientData.find({ patient_id: req.params.id })
          .sort({ createdAt: -1 })
          .limit(1)
          .lean();
        if (latest.length > 0) patient = latest[0];
      }
    }

    if (!patient) {
      console.warn(`❌ Patient record not found for ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Record not found' });
    }

    if (patient.patient_id) {
      const User = require('../models/User');
      const patientUser = await User.findById(patient.patient_id).select('email phone');

      if (patientUser) {
        patient.email = patientUser.email;
        patient.phone = patientUser.phone;
      }
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Full History by Patient Name (For Charting)
const getPatientHistory = async (req, res) => {
  const { name } = req.params;
  const user = req.user;

  try {
    let query = {};

    if (user.role === 'patient') {
      const patientIdObj = new mongoose.Types.ObjectId(user._id);
      console.log(`🔍 Fetching STRICT History for Patient: ${user.name}`);
      query = { patient_id: patientIdObj };
    } else {
      const decodedParam = decodeURIComponent(name);

      if (mongoose.Types.ObjectId.isValid(decodedParam)) {
        const patientIdObj = new mongoose.Types.ObjectId(decodedParam);
        const User = require('../models/User');
        const patientUser = await User.findById(patientIdObj);

        if (patientUser) {
          query = {
            $or: [
              { patient_id: patientIdObj },
              { name: patientUser.name, patient_id: { $exists: false } },
              { name: patientUser.name, patient_id: null }
            ]
          };
        } else {
          query = { patient_id: patientIdObj };
        }
      } else {
        query = { name: { $regex: new RegExp(`^${decodedParam}$`, 'i') } };
      }
    }

    const history = await PatientData.find(query)
      .sort({ createdAt: -1 })
      .populate('doctor_id', 'name')
      .select('prediction.riskScore prediction.riskLevel prediction.confidenceLabel createdAt inputs doctor_id');

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

    // 1. Format inputs before simulating
    const formattedInputs = formatInputsForAI(inputs);
    console.log(`🔗 Sending Simulate request to AI:`, formattedInputs);

    const response = await axios.post(`${aiUrl}/predict`, formattedInputs);
    res.status(200).json(response.data);
  } catch (error) {
    console.error("⚠️ AI Service Error in simulateRisk:", error.message);
    res.status(200).json({ risk_score: 0, risk_level: "Error" });
  }
};

// @desc    CoPilot AI Chat Logic
const copilotRequest = async (req, res) => {
  const { message, context } = req.body;
  const userId = req.user._id;
  const patientId = context._id || context.id;

  try {
    if (context.name) {
      const history = await PatientData.find({ name: context.name })
        .sort({ createdAt: 1 })
        .limit(10)
        .select('prediction.riskScore createdAt inputs');

      context.history = history;
    }

    const role = req.user.role || 'patient';
    const aiUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';

    // FIX: Await the response and properly handle it inside the try block
    const response = await axios.post(`${aiUrl}/copilot`, { message, context, role });
    const aiReply = response.data.reply;

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
    // FIX: Catch block properly placed
    console.error("AI Service Error:", error.message);
    res.status(500).json({ reply: "I'm having trouble connecting to my clinical brain right now." });
  }
};

// @desc    Get Chat History
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

// @desc    Delete Patient Records
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

// @desc    Update Patient Contact & Basic Info
// @desc    Update Patient Contact & Basic Info
const updatePatientDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone, gender, age, hypertension, heart_disease, smoking_history } = req.body;

    const patientData = await PatientData.findById(id);
    if (!patientData) return res.status(404).json({ message: "Patient record not found" });

    // FIX 1: Ensure the inputs object actually exists before we try to modify it
    if (!patientData.inputs) {
      patientData.inputs = {};
    }

    // Apply the updates
    if (gender) patientData.inputs.gender = gender;
    if (age) patientData.inputs.age = Number(age);
    if (hypertension !== undefined) patientData.inputs.hypertension = Number(hypertension);
    if (heart_disease !== undefined) patientData.inputs.heart_disease = Number(heart_disease);

    if (smoking_history) {
      patientData.inputs.smoking_history = smoking_history;
    }

    if (email) patientData.email = email;
    if (phone) patientData.phone = phone;

    // FIX 2: Tell Mongoose explicitly that the nested 'inputs' object has been changed!
    patientData.markModified('inputs');

    // Now save to the database
    await patientData.save();

    let updatedPhone = phone;
    let updatedEmail = email;

    if (patientData.patient_id) {
      const User = require('../models/User');
      const userUpdateFields = {};
      if (email) userUpdateFields.email = email;
      if (phone) userUpdateFields.phone = phone;

      if (Object.keys(userUpdateFields).length > 0) {
        const updatedUser = await User.findByIdAndUpdate(patientData.patient_id, userUpdateFields, { new: true });
        console.log(`🔄 Synced User Profile: ${JSON.stringify(userUpdateFields)}`);
        if (updatedUser) {
          updatedPhone = updatedUser.phone;
          updatedEmail = updatedUser.email;
        }
      } else {
        const user = await User.findById(patientData.patient_id);
        if (user) {
          updatedPhone = user.phone;
          updatedEmail = user.email;
        }
      }
    } else if (email) {
      const User = require('../models/User');
      const fallbackUser = await User.findOne({ email: email });

      if (fallbackUser) {
        console.log(`🔗 Found detached User account for email ${email}. Linking now...`);
        patientData.patient_id = fallbackUser._id;
        await patientData.save();

        if (phone) {
          fallbackUser.phone = phone;
          await fallbackUser.save();
          updatedPhone = phone;
        }
        updatedEmail = fallbackUser.email;
      }
    }

    const responseData = patientData.toObject();
    responseData.phone = updatedPhone;
    responseData.email = updatedEmail;

    res.json({ message: "Patient details updated successfully", data: responseData });
  } catch (error) {
    console.error("Update Error:", error);
    // FIX 3: Send the exact error message back to the frontend so we aren't guessing
    res.status(500).json({ message: "Failed to update details", error: error.message });
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
  deletePatient,
  updatePatientDetails
};
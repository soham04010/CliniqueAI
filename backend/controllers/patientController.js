const axios = require('axios');
const PatientData = require('../models/PatientData');
const CoPilotChat = require('../models/CoPilotChat');
const Notification = require('../models/Notification');
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

      // Attempt to link to Patient Account
      console.log(`🔗 Doctor linking to patient_id: ${req.body.patient_id || 'NONE'}`);
      if (req.body.patient_id) {
        recordData.patient_id = req.body.patient_id;
      } else if (req.body.email) {
        const User = require('../models/User'); // Import dynamically to avoid circular deps if any
        const patientUser = await User.findOne({ email: req.body.email });

        if (!patientUser) {
          return res.status(404).json({ message: "Patient account with this email not found. Please ask patient to register first." });
        }

        recordData.patient_id = patientUser._id;
        console.log(`🔗 Linked assessment to Patient account: ${patientUser.email}`);
      }

    } else {
      recordData.patient_id = userId;
      if (doctor_id) recordData.doctor_id = doctor_id;
    }

    const newRecord = await PatientData.create(recordData);

    // 3. Create Notification for Doctor
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
        // Don't fail the request if notification fails
      }
    } else {
      console.log("⚠️ SKIPPING NOTIFICATION: Conditions not met.");
    }

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

      // Look up patient details (email, phone) using patient_id
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
          userDetails: 0 // Clean up
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
      // 1. Try finding by Record ID (Standard)
      patient = await PatientData.findById(req.params.id).lean();

      // 2. Fallback: If not found by Record ID, try finding by Patient (User) ID
      // This handles cases where the frontend (or user) uses the User ID in the URL
      if (!patient) {
        console.log(`⚠️ Record ID not found. Trying lookup by patient_id: ${req.params.id}`);
        const latest = await PatientData.find({ patient_id: req.params.id })
          .sort({ createdAt: -1 }) // Get latest record
          .limit(1)
          .lean();
        if (latest.length > 0) patient = latest[0];
      }
    }

    if (!patient) {
      console.warn(`❌ Patient record not found for ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Record not found' });
    }

    // Fetch Linked User Details (Email, Phone)
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
// @desc    Get Full History by Patient Name (For Charting)
const getPatientHistory = async (req, res) => {
  const { name } = req.params;
  const user = req.user;

  try {
    let query = {};

    // If logged in as Patient, strictly fetch their own data via ID (linked account)
    // This prevents showing records from other patients with the same name.
    if (user.role === 'patient') {
      const patientIdObj = new mongoose.Types.ObjectId(user._id);

      console.log(`🔍 Fetching STRICT History for Patient: ${user.name} (ID: ${user._id})`);

      // STRICT FILTER: Only show records explicitly linked to this account
      query = { patient_id: patientIdObj };

    } else {
      // If Doctor...
      const decodedParam = decodeURIComponent(name);

      // Check if the parameter is a valid ObjectId (Strict lookup by ID)
      if (mongoose.Types.ObjectId.isValid(decodedParam)) {
        const patientIdObj = new mongoose.Types.ObjectId(decodedParam);
        console.log(`🔍 Doctor fetching history by ID: ${decodedParam}`);

        // Fetch Patient Name to include "Orphan" records (created before registration)
        const User = require('../models/User');
        const patientUser = await User.findById(patientIdObj);

        if (patientUser) {
          console.log(`   Found Patient Name: "${patientUser.name}" - Including orphan records.`);
          query = {
            $or: [
              { patient_id: patientIdObj },                                      // 1. Explicitly Linked
              { name: patientUser.name, patient_id: { $exists: false } },        // 2. Orphan (Old Schema)
              { name: patientUser.name, patient_id: null }                       // 3. Orphan (Null ID)
            ]
          };
        } else {
          query = { patient_id: patientIdObj };
        }

      } else {
        // Fallback: Fetch by Name (Case Insensitive) - potential for ghost records
        console.log(`⚠️ Doctor fetching history by NAME (Legacy): ${decodedParam}`);
        query = { name: { $regex: new RegExp(`^${decodedParam}$`, 'i') } };
      }
    }

    const history = await PatientData.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .select('prediction.riskScore createdAt inputs');

    console.log(`✅ Found ${history.length} records for query:`, JSON.stringify(query));

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

// @desc    Update Patient Contact & Basic Info
const updatePatientDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone, gender, age, hypertension, heart_disease, smoking_history } = req.body;

    // 1. Update Clinical Record (PatientData)
    const patientData = await PatientData.findById(id);
    if (!patientData) return res.status(404).json({ message: "Patient record not found" });

    // Update fields in 'inputs'
    if (patientData.inputs) {
      if (gender) patientData.inputs.gender = (gender === 'Male' ? 1 : 0);
      if (age) patientData.inputs.age = Number(age);
      if (hypertension !== undefined) patientData.inputs.hypertension = Number(hypertension);
      if (heart_disease !== undefined) patientData.inputs.heart_disease = Number(heart_disease);

      // Update Smoking History (Reset all, set new)
      if (smoking_history) {
        patientData.inputs.smoking_history_current = 0;
        patientData.inputs.smoking_history_former = 0;
        patientData.inputs.smoking_history_never = 0;
        patientData.inputs["smoking_history_not current"] = 0;
        patientData.inputs.smoking_history_ever = 0;

        if (smoking_history === 'current') patientData.inputs.smoking_history_current = 1;
        else if (smoking_history === 'former') patientData.inputs.smoking_history_former = 1;
        else if (smoking_history === 'never') patientData.inputs.smoking_history_never = 1;
        else patientData.inputs["smoking_history_not current"] = 1;
      }
    }

    // Explicitly update Contact Details on PatientData
    if (email) patientData.email = email;
    if (phone) patientData.phone = phone;

    await patientData.save();

    // 2. Sync to User Profile (if linked)
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
        // If no update, fetch existing to return consistent data
        const user = await User.findById(patientData.patient_id);
        if (user) {
          updatedPhone = user.phone;
          updatedEmail = user.email;
        }
      }
    } else if (email) {
      // 2b. If NOT linked, try to find User by Email and LINK them
      const User = require('../models/User');
      const fallbackUser = await User.findOne({ email: email });

      if (fallbackUser) {
        console.log(`🔗 Found detached User account for email ${email}. Linking now...`);
        patientData.patient_id = fallbackUser._id;
        await patientData.save();

        // Also update the User's phone if provided
        if (phone) {
          fallbackUser.phone = phone;
          await fallbackUser.save();
          updatedPhone = phone;
        }
        updatedEmail = fallbackUser.email;
      }
    }

    // Return merged data
    const responseData = patientData.toObject();
    responseData.phone = updatedPhone;
    responseData.email = updatedEmail;

    res.json({ message: "Patient details updated successfully", data: responseData });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Failed to update details" });
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
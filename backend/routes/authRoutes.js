const express = require('express');
const router = express.Router();
const User = require('../models/User');
const PatientData = require('../models/PatientData'); // Required for relationship logic
const {
  registerUser,
  loginUser,
  verifyOTP,
  forgotPassword,
  resetPassword,
  updateProfile,
  updatePassword,
  toggle2FA,
  verifyLoginOTP,
  googleLogin,
  requestPhoneChangeOtp,
  verifyPhoneChangeOtp
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginUser);
router.post('/google', googleLogin); // Google Auth Route
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.put('/2fa', protect, toggle2FA);
router.post('/login-otp', verifyLoginOTP);
router.post('/request-phone-otp', protect, requestPhoneChangeOtp);
router.put('/update-phone', protect, verifyPhoneChangeOtp);

// Route for the initial "Select Doctor" dropdown in the test form
router.get('/doctors', protect, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('name _id');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// NEW: Restricted Contact List for the WhatsApp-style Inbox
router.get('/contacts', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    if (role === 'patient') {
      // Patients: Find doctors they have actually assigned a test to
      const distinctDoctorIds = await PatientData.distinct('doctor_id', { patient_id: userId });
      const validDoctorIds = distinctDoctorIds.filter(id => id != null);
      const doctors = await User.find({ _id: { $in: validDoctorIds } }).select('name _id role');
      res.json(doctors);
    } else {
      // Doctors: Find patients who have performed a test under their ID
      const distinctPatientIds = await PatientData.distinct('patient_id', { doctor_id: userId });
      const validPatientIds = distinctPatientIds.filter(id => id != null);
      const patients = await User.find({ _id: { $in: validPatientIds } }).select('name _id role');
      res.json(patients);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
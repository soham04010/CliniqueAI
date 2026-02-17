const express = require('express');
const router = express.Router();
const multer = require('multer'); // Import Multer
const User = require('../models/User');
const PatientData = require('../models/PatientData'); 
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
  verifyPhoneChangeOtp,
  requestPasswordChangeOtp, // NEW Import
  updatePasswordSecure      // NEW Import
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// 1. CONFIGURE MULTER (Memory Storage for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Public Routes
router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/login-otp', verifyLoginOTP);

// Protected Routes
// NOTE: We added upload.single('profilePicture') here to handle the image file
router.put('/profile', protect, upload.single('profilePicture'), updateProfile);

router.put('/password', protect, updatePassword); // Old simple password update
router.put('/2fa', protect, toggle2FA);

// NEW: Secure Password Change Routes
router.post('/request-password-otp', protect, requestPasswordChangeOtp);
router.put('/update-password-secure', protect, updatePasswordSecure);

// NEW: Phone Verification Routes
router.post('/request-phone-otp', protect, requestPhoneChangeOtp);
router.put('/verify-phone-update', protect, verifyPhoneChangeOtp); // Aligning with frontend call

// Route for the initial "Select Doctor" dropdown
router.get('/doctors', protect, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('name _id');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Restricted Contact List for Chat
router.get('/contacts', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    if (role === 'patient') {
      const distinctDoctorIds = await PatientData.distinct('doctor_id', { patient_id: userId });
      const validDoctorIds = distinctDoctorIds.filter(id => id != null);
      const doctors = await User.find({ _id: { $in: validDoctorIds } }).select('name _id role profilePicture avatar');
      res.json(doctors);
    } else {
      const distinctPatientIds = await PatientData.distinct('patient_id', { doctor_id: userId });
      const validPatientIds = distinctPatientIds.filter(id => id != null);
      const patients = await User.find({ _id: { $in: validPatientIds } }).select('name _id role profilePicture avatar');
      res.json(patients);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
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
router.get('/fix-role/:email', require('../controllers/authController').fixUserRole); // Temporary Public Route

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

    const Message = require('../models/Message'); // Import Message Model

    // 1. Fetch Clinical Links (Existing Logic)
    let clinicalIds = [];
    if (role === 'patient') {
      const distinctDoctorIds = await PatientData.distinct('doctor_id', { patient_id: userId });
      clinicalIds = distinctDoctorIds.filter(id => id != null);
    } else {
      const distinctPatientIds = await PatientData.distinct('patient_id', { doctor_id: userId });
      clinicalIds = distinctPatientIds.filter(id => id != null);
    }

    // 2. Fetch Chat History Links (New Logic)
    // Find all users who have sent messages TO me or received messages FROM me
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).select('senderId receiverId');

    const chatIds = new Set();
    messages.forEach(msg => {
      if (msg.senderId.toString() !== userId.toString()) chatIds.add(msg.senderId.toString());
      if (msg.receiverId.toString() !== userId.toString()) chatIds.add(msg.receiverId.toString());
    });

    // 3. Merge Unique IDs
    const allContactIds = [...new Set([...clinicalIds.map(id => id.toString()), ...chatIds])];

    // 4. Fetch User Details
    const contacts = await User.find({ _id: { $in: allContactIds } })
      .select('name _id role profilePicture avatar email phone');

    res.json(contacts);
  } catch (error) {
    console.error("Contacts Fetch Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
const express = require('express');
const mongoose = require('mongoose');
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
router.post('/login-otp', verifyLoginOTP);
// router.get('/fix-role/:email', ...); // Removed

// Protected Routes
// NOTE: We added upload.single('profilePicture') here to handle the image file
router.put('/profile', protect, upload.single('profilePicture'), updateProfile);

router.put('/password', protect, updatePassword); // Old simple password update
router.put('/2fa', protect, toggle2FA);

// NEW: Secure Password Change Routes
router.post('/request-password-otp', protect, requestPasswordChangeOtp);
router.put('/update-password-secure', protect, updatePasswordSecure);

// NEW: Phone Verification Routes
// WhatsApp OTP Routes
router.post('/request-sms-otp', protect, require('../controllers/authController').requestSmsOtp);
router.put('/verify-sms-otp', protect, require('../controllers/authController').verifySmsOtp);

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

    // 3. Merge Unique IDs and Validate
    let finalContactIds;
    if (role === 'doctor') {
      // Doctors ONLY see patients from their clinical registry
      finalContactIds = [...new Set(clinicalIds.map(id => id.toString()))];
    } else {
      // Patients see assigned doctors + anyone they've communicated with
      finalContactIds = [...new Set([...clinicalIds.map(id => id.toString()), ...chatIds])];
    }

    const allContactIds = finalContactIds
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    // 4. Fetch User Details with Aggregation for Unread Counts and Last Message
    const contacts = await User.aggregate([
      { $match: { _id: { $in: allContactIds } } },
      {
        $lookup: {
          from: 'messages',
          let: { contactId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        { $and: [{ $eq: ['$senderId', '$$contactId'] }, { $eq: ['$receiverId', userId] }] },
                        { $and: [{ $eq: ['$senderId', userId] }, { $eq: ['$receiverId', '$$contactId'] }] }
                      ]
                    },
                    { $not: { $in: [userId, { $ifNull: ['$deletedBy', []] }] } }
                  ]
                }
              }
            },
            { $sort: { timestamp: -1 } },
            { $limit: 1 }
          ],
          as: 'lastMessageArr'
        }
      },
      {
        $lookup: {
          from: 'messages',
          let: { contactId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$senderId', '$$contactId'] },
                    { $eq: ['$receiverId', userId] },
                    { $eq: ['$isRead', false] },
                    { $not: { $in: [userId, { $ifNull: ['$deletedBy', []] }] } }
                  ]
                }
              }
            }
          ],
          as: 'unreadMessages'
        }
      },
      {
        $project: {
          name: 1,
          role: 1,
          profilePicture: 1,
          avatar: 1,
          email: 1,
          phone: 1,
          lastMessage: { $arrayElemAt: ['$lastMessageArr', 0] },
          unreadCount: { $size: '$unreadMessages' }
        }
      }
    ]);

    res.json(contacts);
  } catch (error) {
    console.error("Contacts Fetch Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get Public User Profile
router.get('/user/:id', protect, require('../controllers/authController').getUserPublicProfile);

module.exports = router;
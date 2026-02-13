const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  verifyOTP, // Changed from verifyEmail
  forgotPassword, 
  resetPassword 
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP); // Changed route
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
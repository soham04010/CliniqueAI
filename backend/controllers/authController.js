const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register Patient & Send OTP Code
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists. Please Login.' });

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-Digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create User
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'patient',
      verificationCode: otp,
      verificationCodeExpire: Date.now() + 10 * 60 * 1000, // 10 Minutes
      isVerified: false 
    });

    // Send Email
    const message = `
      <h1>Welcome to CliniqueAI</h1>
      <p>Your Verification Code is:</p>
      <h2 style="color: blue;">${otp}</h2>
      <p>Enter this code to verify your account.</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'CliniqueAI Verification Code',
        html: message,
      });
      // Send success response
      res.status(201).json({ message: 'OTP Sent to email', email: user.email });
    } catch (emailError) {
      console.error("❌ EMAIL FAILED:", emailError.message);
      res.status(201).json({ 
        message: 'Account created but email failed. Check console for code.',
        devOtp: otp // For testing purposes only
      });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP Code
// @route   POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({
      email,
      verificationCode: otp,
      verificationCodeExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpire = undefined;
    await user.save();

    res.status(200).json({ 
      _id: user._id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      message: 'Email verified successfully!' 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login User
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (user && (await bcrypt.compare(password, user.password))) {
      
      // Check Verification
      if (user.role === 'patient' && !user.isVerified) {
        return res.status(401).json({ message: 'Please verify your email first.' });
      }

      // Return UID and Role for redirection
      res.json({
        _id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot Password (OTP)
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not registered." });
    
    if (user.role === 'doctor') {
      return res.status(403).json({ message: "Doctors must contact Admin." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    const message = `<h1>Password Reset</h1><p>Your OTP is: <strong>${otp}</strong></p>`;
    
    try {
      await sendEmail({ to: user.email, subject: 'Password Reset OTP', html: message });
      res.status(200).json({ message: "OTP sent to your email" });
    } catch (err) {
      user.resetPasswordOTP = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: "Email failed to send" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Invalid or Expired OTP" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, verifyOTP, loginUser, forgotPassword, resetPassword };
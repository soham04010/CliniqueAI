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

    // AUTO-LINK: Check if a Doctor has already created a patient record for this email
    try {
      const PatientData = require('../models/PatientData');
      const existingRecord = await PatientData.findOne({ email: email, patient_id: { $exists: false } });

      if (existingRecord) {
        console.log(`🔗 Auto-linking new user ${email} to existing patient record ${existingRecord._id}`);
        existingRecord.patient_id = user._id;
        await existingRecord.save();
      }
    } catch (linkError) {
      console.error("⚠️ Failed to auto-link patient record:", linkError.message);
      // Continue usually, don't fail registration
    }

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
      console.error("❌ Reset Password Email Failed:", err.message);
      // Fallback: Don't fail the request, return OTP in dev mode or generic success
      // In production, you might want to fail, but for now let's prevent hanging
      res.status(200).json({
        message: "Email failed to send. Check console for OTP (Dev Mode).",
        devOtp: otp
      });
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

// @desc    Update User Profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.specialization = req.body.specialty || user.specialization; // Backend uses 'specialization'
      user.phone = req.body.phone || user.phone;
      user.bio = req.body.bio || user.bio;
      user.clinicName = req.body.clinicName || user.clinicName;
      user.license = req.body.license || user.license;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        uid: updatedUser.uid,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        specialty: updatedUser.specialization,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
        clinicName: updatedUser.clinicName,
        license: updatedUser.license,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Password
// @route   PUT /api/auth/password
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (user && (await bcrypt.compare(currentPassword, user.password))) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(401).json({ message: 'Invalid current password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP for Login
// @route   POST /api/auth/login-otp
const verifyLoginOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.twoFactorOTP !== otp || user.twoFactorOTPExpire < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP
    user.twoFactorOTP = undefined;
    user.twoFactorOTPExpire = undefined;
    await user.save();

    res.json({
      _id: user._id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle 2FA
// @route   PUT /api/auth/2fa
const toggle2FA = async (req, res) => {
  const { enable } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.twoFactorEnabled = enable;
      await user.save();
      res.json({ message: `2FA ${enable ? 'enabled' : 'disabled'}` });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Google Login/Signup
// @route   POST /api/auth/google
const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, picture, sub } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (user) {
      // User exists, login
      res.json({
        _id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      // User doesn't exist, create new patient
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'patient', // Default to patient
        isVerified: true, // Google email is verified
        googleId: sub,
        avatar: picture
      });

      res.status(201).json({
        _id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
};

// @desc    Request OTP for Phone Change
// @route   POST /api/auth/request-phone-otp
const requestPhoneChangeOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate 6-Digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to user (reusing verificationCode fields or creating new ones)
    // For simplicity, let's reuse verificationCode but context is important.
    // Ideally use separate fields or a temp store, but here we'll use verificationCode
    user.verificationCode = otp;
    user.verificationCodeExpire = Date.now() + 10 * 60 * 1000; // 10 Minutes
    await user.save();

    // Send Email
    const message = `
      <h1>Phone Number Update Request</h1>
      <p>Your Verification Code is:</p>
      <h2 style="color: blue;">${otp}</h2>
      <p>Use this code to verify your new phone number.</p>
    `;

    // ALWAYS log OTP to console for development/testing
    console.log(`📧 [DEV] Email OTP for ${user.email}: ${otp}`);

    try {
      await sendEmail({
        to: user.email,
        subject: 'CliniqueAI Phone Update Code',
        html: message,
      });
      res.status(200).json({ message: "OTP sent to your email address." });
    } catch (emailError) {
      console.error("❌ EMAIL FAILED:", emailError.message);
      // Fallback for dev/testing if email fails
      res.status(200).json({
        message: "Email failed. Check console for code (Dev Mode).",
        devOtp: otp
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to generate OTP" });
  }
};

// @desc    Verify OTP and Update Phone
// @route   PUT /api/auth/update-phone
const verifyPhoneChangeOtp = async (req, res) => {
  const { otp, newPhone } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.verificationCode !== otp || user.verificationCodeExpire < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Update Phone
    user.phone = newPhone;
    user.verificationCode = undefined;
    user.verificationCodeExpire = undefined;

    // Also update linked PatientData if exists
    // This fixes the sync issue where updating user didn't update patient records
    const PatientData = require('../models/PatientData');
    await PatientData.updateMany(
      { patient_id: user._id },
      { $set: { phone: newPhone } } // Explicitly set phone field in PatientData
    );

    await user.save();

    res.status(200).json({ message: "Phone number updated successfully", phone: newPhone });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  verifyOTP,
  loginUser,
  forgotPassword,
  resetPassword,
  updateProfile,
  updatePassword,
  verifyLoginOTP,
  toggle2FA,
  googleLogin,
  requestPhoneChangeOtp,
  verifyPhoneChangeOtp
};
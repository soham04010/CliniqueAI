const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const twilio = require('twilio'); // Re-added for WhatsApp

// Initialize Twilio Client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// 1. CONFIGURE CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// --- WhatsApp OTP Functions ---

const requestWhatsAppOtp = async (req, res) => {
  const { phoneNumber } = req.body; // Expecting E.164 format (e.g. +91...)

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate 6-Digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to User
    user.verificationCode = otp;
    user.verificationCodeExpire = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    // Sanitize Phone Number (Remove spaces, dashes, parens)
    const sanitizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Send WhatsApp Message
    await twilioClient.messages.create({
      body: `Your CliniqueAI verification code is: ${otp}`,
      from: 'whatsapp:+14155238886', // Twilio Sandbox Number
      to: `whatsapp:${sanitizedPhone}`
    });

    res.status(200).json({ message: "WhatsApp OTP sent successfully." });
  } catch (error) {
    console.error("Twilio WhatsApp Error:", error);
    res.status(500).json({ message: "Failed to send WhatsApp OTP.", error: error.message });
  }
};

const verifyWhatsAppOtp = async (req, res) => {
  const { otp, phoneNumber } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.verificationCode !== otp || user.verificationCodeExpire < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Update Phone
    user.mobileNumber = phoneNumber;
    user.isMobileVerified = true;

    // Clear OTP
    user.verificationCode = undefined;
    user.verificationCodeExpire = undefined;

    // Update Linked PatientData
    const PatientData = require('../models/PatientData');
    await PatientData.updateMany(
      { patient_id: user._id },
      { $set: { phone: phoneNumber } }
    );

    await user.save();

    res.status(200).json({ message: "Phone number verified successfully", mobileNumber: phoneNumber });
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ message: "Verification failed", error: error.message });
  }
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
      res.status(201).json({ message: 'OTP Sent to email', email: user.email });
    } catch (emailError) {
      console.error("❌ EMAIL FAILED:", emailError.message);
      res.status(201).json({
        message: 'Account created but email failed. Check console for code.',
        devOtp: otp
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

      // Return UID, Role, and NEW FIELDS (Photo & Mobile)
      res.json({
        _id: user._id,
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || user.avatar, // Prefer uploaded photo
        mobileNumber: user.mobileNumber,
        isMobileVerified: user.isMobileVerified,
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
    // Case-insensitive email search
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (!user) return res.status(404).json({ message: "Email not registered." });

    // if (user.role === 'doctor') {
    //   return res.status(403).json({ message: "Doctors must contact Admin." });
    // }

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
    console.log(`🔑 Reset Password Request: Email=${email}, OTP=${otp}`);

    // Debug: Find user by email first to check OTP status
    const debugUser = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (debugUser) {
      console.log(`🔎 Debug User Found: OTP=${debugUser.resetPasswordOTP}, Expires=${debugUser.resetPasswordExpire}, Now=${new Date()}`);
      console.log(`⏱️ Time Left: ${(new Date(debugUser.resetPasswordExpire) - new Date()) / 1000}s`);
    } else {
      console.log("❌ Debug User Not Found");
    }

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') },
      resetPasswordOTP: otp,
      resetPasswordExpire: { $gt: Date.now() } // Ensure this matches DB format
    });

    if (!user) {
      console.warn("⚠️ OTP Verification Failed: Invalid Code or Expired.");
      return res.status(400).json({ message: "Invalid or Expired OTP" });
    }

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

// @desc    Update User Profile (Supports Photo Upload)
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // 1. Update Text Fields
      user.name = req.body.name || user.name;
      user.specialization = req.body.specialty || user.specialization;
      user.phone = req.body.phone || user.phone;
      user.bio = req.body.bio || user.bio;
      user.clinicName = req.body.clinicName || user.clinicName;
      user.license = req.body.license || user.license;

      // 2. Handle Image Upload to Cloudinary (If file exists)
      if (req.file) {
        const streamUpload = (fileBuffer) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "clinique_patients" },
              (error, result) => {
                if (result) resolve(result);
                else reject(error);
              }
            );
            streamifier.createReadStream(fileBuffer).pipe(stream);
          });
        };

        const result = await streamUpload(req.file.buffer);
        user.profilePicture = result.secure_url; // Save the Cloudinary URL
      }

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
        profilePicture: updatedUser.profilePicture, // Return new photo
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Password (Simple)
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

// @desc    Request Password Change OTP
// @route   POST /api/auth/request-password-otp
const requestPasswordChangeOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.verificationCode = otp;
    user.verificationCodeExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Secure Password Change Code',
      html: `<h1>Password Change Request</h1><p>Your Code: <strong>${otp}</strong></p>`
    });

    res.status(200).json({ message: "Verification code sent to email." });
  } catch (error) {
    res.status(500).json({ message: "Failed to send code" });
  }
};

// @desc    Verify OTP and Update Password (Secure)
// @route   PUT /api/auth/update-password-secure
const updatePasswordSecure = async (req, res) => {
  const { currentPassword, newPassword, otp } = req.body;
  try {
    const user = await User.findById(req.user._id);

    // 1. Verify OTP
    if (user.verificationCode !== otp || user.verificationCodeExpire < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    // 2. Verify Current Password
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ message: 'Invalid current password' });
    }

    // 3. Update Password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.verificationCode = undefined;
    user.verificationCodeExpire = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully' });
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

module.exports = {
  registerUser,
  verifyOTP,
  loginUser,
  forgotPassword,
  resetPassword,
  updateProfile,
  updatePassword,
  updatePasswordSecure,
  verifyLoginOTP,
  toggle2FA,
  googleLogin,
  requestPasswordChangeOtp,
  requestWhatsAppOtp,
  verifyWhatsAppOtp
};
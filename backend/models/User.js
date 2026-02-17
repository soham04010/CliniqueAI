const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    default: uuidv4,
    unique: true
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['doctor', 'patient'],
    default: 'patient'
  },
  specialization: { type: String }, // For doctors

  // Profile Fields
  phone: { type: String }, // Old field (kept for backward compatibility)
  mobileNumber: { type: String }, // NEW: Verified Mobile Number
  isMobileVerified: { type: Boolean, default: false }, // NEW
  
  bio: { type: String },
  clinicName: { type: String },
  license: { type: String },
  
  // Profile Picture (Cloudinary URL)
  avatar: { type: String }, // Used by Google Auth
  profilePicture: { type: String }, // NEW: Custom Uploaded Photo

  // 2FA Fields
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorOTP: String,
  twoFactorOTPExpire: Date,

  // Verification Fields (OTP)
  isVerified: { type: Boolean, default: false },
  verificationCode: String,
  verificationCodeExpire: Date,

  // Forgot Password Fields
  resetPasswordOTP: String,
  resetPasswordExpire: Date,

  // Google Auth
  googleId: String,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
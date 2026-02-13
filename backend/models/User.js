const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Make sure to npm install uuid

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
  
  // Verification Fields (OTP)
  isVerified: { type: Boolean, default: false },
  verificationCode: String,
  verificationCodeExpire: Date,

  // Forgot Password Fields
  resetPasswordOTP: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
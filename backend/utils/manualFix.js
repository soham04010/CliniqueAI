const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const fixDoctor = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to DB');

    const email = "dr.soham@clinique.com";
    const rawPassword = "admin123";

    // 1. DELETE existing doctor
    await User.deleteOne({ email: email });
    console.log(`🗑️  Deleted old record for ${email}`);

    // 2. CREATE fresh doctor
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    await User.create({
      name: "Dr. Soham",
      email: email,
      password: hashedPassword,
      role: "doctor",
      specialization: "Endocrinologist",
      isVerified: true
    });

    console.log(`✨ Created FRESH doctor account.`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${rawPassword}`);
    console.log(`🔐 Hash: ${hashedPassword}`);
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixDoctor();
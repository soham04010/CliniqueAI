const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedDoctors = async () => {
  const results = [];
  const filePath = path.join(__dirname, '..', 'data', 'doctors.csv');

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ No doctors.csv found.`);
    return;
  }

  // 1. Helper to clean strings (Removes spaces and invisible characters)
  const clean = (str) => (str ? str.toString().trim() : "");

  fs.createReadStream(filePath)
    .pipe(csv({ mapHeaders: ({ header }) => header.trim() })) // Trim headers too
    .on('data', (data) => {
      // Clean every value in the row
      const cleanData = {};
      Object.keys(data).forEach(key => {
        cleanData[key] = clean(data[key]);
      });
      results.push(cleanData);
    })
    .on('end', async () => {
      console.log('🔍 Syncing Doctors (Auto-Cleaning Spaces)...');
      
      for (const doc of results) {
        if (!doc.email || !doc.password) continue;

        const email = doc.email.toLowerCase(); // Force lowercase
        
        // 2. Hash the CLEAN password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(doc.password, salt);

        const user = await User.findOne({ email: email });

        if (!user) {
          await User.create({
            name: doc.name,
            email: email,
            password: hashedPassword,
            role: 'doctor',
            specialization: doc.specialization,
            isVerified: true
          });
          console.log(`✅ Created: ${doc.name}`);
        } else {
          // 3. FORCE UPDATE PASSWORD (Overwrites the old "spaced" password)
          user.password = hashedPassword;
          user.name = doc.name;
          await user.save();
          console.log(`🔄 Fixed Credentials for: ${doc.name}`);
        }
      }
      console.log('👨‍⚕️ Doctor Sync Completed.');
    });
};

module.exports = seedDoctors;
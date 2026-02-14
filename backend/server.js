const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const seedDoctors = require('./utils/seedDoctors');

// Load environment variables
dotenv.config();

const app = express();

// 1. CORS Configuration
// Allows your Frontend (Port 3000) to talk to this Backend
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// 2. Middleware to parse JSON bodies
app.use(express.json());

// 3. Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    // Run Seeder to ensure Doctor accounts exist
    seedDoctors(); 
  })
  .catch(err => {
    console.error('❌ DB Connection Error:', err.message);
    // Don't crash the server, just log the error
  });

// 4. API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes')); // AI & Patient Data

// 5. Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: err.message 
  });
});

// 6. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
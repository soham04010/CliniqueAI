const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const seedDoctors = require('./utils/seedDoctors');

dotenv.config();

const app = express();

// 1. ALLOW FRONTEND CONNECTION (CORS)
app.use(cors({
  origin: "http://localhost:3000", // Allow Next.js frontend
  credentials: true
}));

app.use(express.json());

// 2. CONNECT DATABASE
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    // Run the doctor seeder on startup
    seedDoctors(); 
  })
  .catch(err => console.log('❌ DB Connection Error:', err));

// 3. ROUTES
app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/patients', require('./routes/patientRoutes'));

// 4. GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
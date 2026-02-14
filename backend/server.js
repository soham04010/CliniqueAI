const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io'); 
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const seedDoctors = require('./utils/seedDoctors');
const Message = require('./models/Message');

dotenv.config();

const app = express();
const server = http.createServer(app); 

// 1. Initialize Socket.io with proper CORS
const io = new Server(server, { 
  cors: { 
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  } 
});

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());

// 2. Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    seedDoctors(); 
  })
  .catch(err => {
    console.error('❌ DB Connection Error:', err.message);
  });

// 3. Socket.io Logic
io.on("connection", (socket) => {
  // console.log("User Connected:", socket.id);

  socket.on("join_room", (userId) => {
    if (userId) {
      socket.join(userId.toString());
      // console.log(`User joined room: ${userId}`);
    }
  });

  socket.on("send_message", async (data) => {
    const { senderId, receiverId, message } = data;
    
    // FIX: Add a safety check to prevent ValidationError crash
    if (!senderId || !receiverId || !message) {
      console.error("⚠️ Incomplete message data received. Skipping save.");
      return;
    }

    try {
      // 1. Persist to Database
      const newMessage = new Message({ senderId, receiverId, message });
      await newMessage.save();

      // 2. Send to Receiver and back to Sender for confirmation
      const payload = {
        ...data,
        _id: newMessage._id,
        timestamp: newMessage.timestamp
      };

      io.to(receiverId.toString()).emit("receive_message", payload);
    } catch (err) {
      console.error("❌ Error saving message:", err.message);
    }
  });

  socket.on("disconnect", () => {
    // console.log("User Disconnected");
  });
});

// 4. API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// 5. Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
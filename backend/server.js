const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

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

// =================================================================
// 1. DEFINE ALLOWED ORIGINS (Localhost + Vercel)
// =================================================================
// =================================================================
// 1. DEFINE ALLOWED ORIGINS (Localhost + Vercel + Env Var)
// =================================================================
const allowedOrigins = [
  "http://localhost:3000",
  "https://clinique-ai-ten.vercel.app",
  "https://clinique-ai-ten.vercel.app/",
  // Add production domains here or via ENV
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : [])
];

// =================================================================
// 2. INITIALIZE SOCKET.IO WITH UPDATED CORS
// =================================================================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// =================================================================
// 3. INITIALIZE EXPRESS CORS
// =================================================================
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// 3.5 Global Request Logger
app.use((req, res, next) => {
  console.log(`📡 Incoming Request: [${req.method}] ${req.originalUrl}`);
  next();
});

// 4. Health Check
app.get('/', (req, res) => {
  res.send('API is running...');
});

// 5. Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    seedDoctors();
  })
  .catch(err => {
    console.error('❌ DB Connection Error:', err.message);
  });

// 5. Socket.io Logic (Preserved exactly as your code)
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

    // Safety check to prevent ValidationError crash
    if (!senderId || !receiverId || !message) {
      console.error("⚠️ Incomplete message data received. Skipping save.");
      return;
    }

    try {
      // A. Persist to Database
      const newMessage = new Message({ senderId, receiverId, message });
      await newMessage.save();

      // B. Send to Receiver
      const payload = {
        ...data,
        _id: newMessage._id,
        timestamp: newMessage.timestamp
      };

      // Emit to the specific user room
      io.to(receiverId.toString()).emit("receive_message", payload);

    } catch (err) {
      console.error("❌ Error saving message:", err.message);
    }
  });

  socket.on("disconnect", () => {
    // console.log("User Disconnected");
  });
});


// 5.7 Health Check & Route Listing
app.get('/api/test', (req, res) => {
  res.json({ message: "API route is working!", date: new Date().toISOString() });
});

app.get('/api/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(r => {
    if (r.route) {
      routes.push(`${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);
    } else if (r.name === 'router') {
      const base = r.regexp.toString()
        .replace('/^', '')
        .replace('\\/?(?=\\/|$)/i', '')
        .replace(/\\\//g, '/')
        .replace('(?:/(?=$))?', '');
      r.handle.stack.forEach(sr => {
        if (sr.route) {
          routes.push(`${Object.keys(sr.route.methods).join(',').toUpperCase()} ${base}${sr.route.path}`);
        }
      });
    }
  });
  res.json({ count: routes.length, routes });
});

app.post('/api/test-login', (req, res) => {
  res.json({ 
    message: "POST test route works!", 
    receivedBody: req.body,
    timestamp: new Date().toISOString() 
  });
});

// 6. API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// 7. Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// 8. Route Visualizer (Debug) - Moved to bottom to avoid crash
if (app._router && app._router.stack) {
  console.log("🛠️ --- Mounted API Routes ---");
  app._router.stack.forEach(r => {
    if (r.route && r.route.path) {
      console.log(`✅ [${Object.keys(r.route.methods)}] ${r.route.path}`);
    } else if (r.name === 'router') {
      r.handle.stack.forEach(sr => {
        if (sr.route && sr.route.path) {
          console.log(`✅ [${Object.keys(sr.route.methods)}] ${r.regexp.toString().replace('/^', '').replace('\\/?(?=\\/|$)/i', '')}${sr.route.path}`);
        }
      });
    }
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
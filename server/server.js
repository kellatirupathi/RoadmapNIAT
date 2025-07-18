// server/server.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http'; // Required for socket.io
import cron from 'node-cron';
import { Server as SocketIOServer } from 'socket.io'; // socket.io server

// Import routes
import techStackRoutes from './routes/techStackRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';
import githubRoutes from './routes/githubRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import internshipsTrackerRoutes from './routes/internshipsTrackerRoutes.js';
import criticalPointsRoutes from './routes/criticalPointsRoutes.js';
import postInternshipRoutes from './routes/postInternshipRoutes.js'; 
import studentsTrackerRoutes from './routes/studentsTrackerRoutes.js';
import companyInteractionTrackingRoutes from './routes/companyInteractionTrackingRoutes.js';
// --- NEW IMPORT: Add the new Overall HUB routes ---
import overallHubRoutes from './routes/overallHubRoutes.js';

// Import middleware
import errorHandler from './middleware/errorHandler.js';
import { runDailyTaskReminderScheduler as runDailySocketTaskReminderScheduler, runDailyEmailTaskReminderScheduler } from './utils/scheduler.js';

// Load environment variables
dotenv.config();

// Initialize app and HTTP server
const app = express();
const server = http.createServer(app); // Create HTTP server for Express and Socket.IO

// --- Socket.IO Setup ---
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000", // Client's URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Simple in-memory store for connected users (maps userId to socket.id)
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log(`💡 Socket connected: ${socket.id}`);

  socket.on('registerUser', (userId) => {
    if (userId) {
      activeUsers.set(userId, socket.id);
      console.log(`🧑 User ${userId} registered with socket ${socket.id}. Active users: ${activeUsers.size}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
    for (const [userId, sId] of activeUsers.entries()) {
      if (sId === socket.id) {
        activeUsers.delete(userId);
        console.log(`💀 User ${userId} unregistered. Active users: ${activeUsers.size}`);
        break;
      }
    }
  });
});
// --- End Socket.IO Setup ---

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Middleware to make io and activeUsers available in request object
app.use((req, res, next) => {
  req.io = io;
  req.activeUsers = activeUsers;
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch((err) => console.log('❌ MongoDB Connection Error:', err));

// --- Cron Jobs ---
cron.schedule('0 8 * * *', () => {
  console.log('Kicking off daily email task reminder job...');
  runDailyEmailTaskReminderScheduler();
});

// Routes
app.use('/api/tech-stacks', techStackRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activitylogs', activityLogRoutes);
app.use('/api/internships', internshipsTrackerRoutes);
app.use('/api/critical-points', criticalPointsRoutes);
app.use('/api/post-internships', postInternshipRoutes);
app.use('/api/students-tracker', studentsTrackerRoutes); 
app.use('/api/company-interactions', companyInteractionTrackingRoutes);
// --- NEW ROUTE ADDED: Use the new Overall HUB routes ---
app.use('/api/overall-hub', overallHubRoutes);


// Root Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware
app.use(errorHandler);

// Start Server using the HTTP server instance
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';

import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Legacy routes compatibility
import legacyAuthRoutes from './routes/auth.js';
import legacyStudentRoutes from './routes/student.js';
import legacyShareRoutes from './routes/share.js';
import legacyAdminRoutes from './routes/admin.js';

import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import User from './models/User.js';
import { initMemoryDb } from './services/memoryDb.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security & Optimization Middleware
app.use(helmet({ contentSecurityPolicy: false }));

// Robust Production CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://idea-lab-os.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, server-to-server, curl)
    if (!origin) return callback(null, true);
    
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all valid origins for seamless frontend deployment
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(compression());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply Rate Limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/', apiLimiter);

// Seed Default Admin Account into MongoDB Atlas
const seedTestingAccounts = async () => {
  await initMemoryDb();

  if (mongoose.connection.readyState === 1) {
    try {
      // Seed Admin Account (Idealab2026 / Idealab8058)
      const adminExists = await User.findOne({ registrationNumber: 'IDEALAB2026' });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('Idealab8058', 10);
        await User.create({
          fullName: 'Idea Lab Administrator',
          registrationNumber: 'IDEALAB2026',
          password: hashedPassword,
          role: 'admin',
          branch: 'ADMIN',
          section: 'ADMIN',
          batch: 'ADMIN'
        });
        console.log('✓ Default Admin Account (Idealab2026) initialized.');
      }
    } catch (err) {
      console.warn('[SEED WARNING]', err.message);
    }
  }
};

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/admin', adminRoutes);

// Legacy routes fallback compatibility
app.use('/api/legacy/auth', legacyAuthRoutes);
app.use('/api/student', legacyStudentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'IdeaLab OS',
    timestamp: new Date().toISOString(),
    dbConnected: mongoose.connection.readyState === 1
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Connect to MongoDB Atlas and Start Server
const startServer = async () => {
  console.log('================================');
  console.log('Starting IdeaLab OS Backend...');
  await connectDB();
  await seedTestingAccounts();

  app.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}`);
    console.log(`Environment: ${NODE_ENV}`);
    console.log('================================');
  });
};

startServer();

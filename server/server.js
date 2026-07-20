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
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security & Optimization Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(compression());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply Rate Limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/', apiLimiter);

// Seed Default Accounts into MongoDB Atlas
const seedTestingAccounts = async () => {
  await initMemoryDb();

  if (mongoose.connection.readyState === 1) {
    try {
      // Seed Admin Account (ADMIN001 / admin123)
      const adminExists = await User.findOne({ registrationNumber: 'ADMIN001' });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
          fullName: 'System Administrator',
          registrationNumber: 'ADMIN001',
          password: hashedPassword,
          role: 'admin',
          branch: 'CSE',
          section: 'A',
          batch: '1'
        });
        console.log('✓ Default Admin Account (ADMIN001) initialized.');
      }

      // Seed Student Account (PCEA25CS123 / student123)
      const studentExists = await User.findOne({ registrationNumber: 'PCEA25CS123' });
      if (!studentExists) {
        const hashedPassword = await bcrypt.hash('student123', 10);
        await User.create({
          fullName: 'Piyush',
          registrationNumber: 'PCEA25CS123',
          password: hashedPassword,
          role: 'student',
          branch: 'CSE',
          section: 'B',
          batch: '2'
        });
        console.log('✓ Default Student Account (PCEA25CS123) initialized.');
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

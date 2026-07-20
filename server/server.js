import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';

import authRoutes from './routes/authRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Legacy routes fallback compatibility
import legacyAuthRoutes from './routes/auth.js';
import legacyStudentRoutes from './routes/student.js';
import legacyShareRoutes from './routes/share.js';
import legacyAdminRoutes from './routes/admin.js';

import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import User from './models/User.js';
import { initMemoryDb } from './services/memoryDb.js';

dotenv.config();

// Disable command buffering so queries fail-fast when DB is connecting/offline
mongoose.set('bufferCommands', false);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/idealab_os';

// Security & Optimization Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply Rate Limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/', apiLimiter);

// Seed Default Accounts
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
        console.log('[SEED] Default Admin Account (ADMIN001) registered.');
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
        console.log('[SEED] Default Student Account (PCEA25CS123) registered.');
      }
    } catch (err) {
      console.warn('[SEED WARNING]', err.message);
    }
  }
};

// MongoDB Atlas Connection
console.log('[DB] Connecting to MongoDB Atlas...');
mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    console.log('[DB] Connected to MongoDB Atlas ("idealab_os")');
    seedTestingAccounts();
  })
  .catch((err) => {
    console.warn('[DB WARNING] Could not connect to MongoDB Atlas:', err.message);
    console.log('[DB] Running fail-safe Memory DB for seamless availability.');
    seedTestingAccounts();
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/admin', adminRoutes);

// Legacy routes compatibility
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

app.listen(PORT, () => {
  console.log(`🚀 IdeaLab OS Backend Server running on http://localhost:${PORT}`);
});

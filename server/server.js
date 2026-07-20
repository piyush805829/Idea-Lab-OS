import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

import authRoutes from './routes/auth.js';
import studentRoutes from './routes/student.js';
import shareRoutes from './routes/share.js';
import adminRoutes from './routes/admin.js';

import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Schedule from './models/Schedule.js';
import LabRecord from './models/LabRecord.js';
import Attendance from './models/Attendance.js';
import { initMemoryDb } from './services/memoryDb.js';

dotenv.config();

// Disable Mongoose command buffering so queries fail-fast when DB is disconnected
mongoose.set('bufferCommands', false);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusos';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Seed default Testing Accounts (Admin & Student) if not present
const seedTestingAccounts = async () => {
  // Always initialize memory DB first
  await initMemoryDb();

  if (mongoose.connection.readyState === 1) {
    try {
      // Seed Admin Account
      const adminExists = await User.findOne({ regNumber: 'ADMIN001' });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const adminUser = new User({
          fullName: 'System Administrator',
          regNumber: 'ADMIN001',
          password: hashedPassword,
          role: 'admin',
          section: 'ADMIN',
          batch: 'ADMIN',
          branch: 'ADMIN'
        });
        await adminUser.save();
        await Schedule.create({ userId: adminUser._id, timetable: {} });
        await LabRecord.create({ userId: adminUser._id, labs: {} });
        await Attendance.create({ userId: adminUser._id, attendance: {} });
        console.log('Default Admin Account seeded in Mongoose: ADMIN001 / admin123');
      }

      // Seed Student Account (Piyush / PCEA25CS123)
      const studentExists = await User.findOne({ regNumber: 'PCEA25CS123' });
      if (!studentExists) {
        const hashedPassword = await bcrypt.hash('student123', 10);
        const studentUser = new User({
          fullName: 'Piyush',
          regNumber: 'PCEA25CS123',
          password: hashedPassword,
          role: 'student',
          section: 'B',
          batch: '2',
          branch: 'CSE'
        });
        await studentUser.save();
        await Schedule.create({ userId: studentUser._id, timetable: {} });
        await LabRecord.create({ userId: studentUser._id, labs: {} });
        await Attendance.create({ userId: studentUser._id, attendance: {} });
        console.log('Default Student Account seeded in Mongoose: PCEA25CS123 / student123');
      }
    } catch (err) {
      console.warn('Mongoose seeding skipped:', err.message);
    }
  }
};

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/admin', adminRoutes);

// Base route test
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CampusOS API Server Running' });
});

// Start DB connection with automatic MongoMemoryServer fallback
const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    console.log(`Connected to MongoDB Atlas / Local DB: ${MONGO_URI}`);
  } catch (err) {
    console.warn(`Local MongoDB service not found on ${MONGO_URI}: ${err.message}`);
    console.log('Starting Embedded In-Memory MongoDB Engine...');
    try {
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`Connected to Embedded In-Memory MongoDB: ${memoryUri}`);
    } catch (memErr) {
      console.warn('Embedded MongoDB launcher skipped, relying on fast memoryDb store:', memErr.message);
    }
  }

  // Seed testing accounts once server is starting
  await seedTestingAccounts();

  app.listen(PORT, () => {
    console.log(`CampusOS Backend Server running on port ${PORT}`);
  });
};

startServer();

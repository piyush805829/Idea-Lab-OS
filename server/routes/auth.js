import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Schedule from '../models/Schedule.js';
import LabRecord from '../models/LabRecord.js';
import Attendance from '../models/Attendance.js';
import AuditLog from '../models/AuditLog.js';
import memoryStore, { initMemoryDb } from '../services/memoryDb.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campusos_secret_key';

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { fullName, regNumber, password, confirmPassword, section, batch, branch } = req.body;

    if (!fullName || !regNumber || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const cleanReg = regNumber.trim().toUpperCase();
    const isDbConnected = mongoose.connection.readyState === 1;

    let existingUser = null;

    if (isDbConnected) {
      try {
        existingUser = await User.findOne({ regNumber: cleanReg });
      } catch (e) {}
    }

    if (!existingUser) {
      await initMemoryDb();
      existingUser = memoryStore.users.find(u => u.regNumber === cleanReg);
    }

    if (existingUser) {
      return res.status(400).json({ message: 'This Registration Number is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = 'student';
    let userId = `mem_${Date.now()}`;

    if (isDbConnected) {
      try {
        const newUser = new User({
          fullName: fullName.trim(),
          regNumber: cleanReg,
          password: hashedPassword,
          role: userRole,
          section: section || '',
          batch: batch || '',
          branch: branch || ''
        });
        await newUser.save();
        userId = newUser._id;

        await Schedule.create({ userId, timetable: {} });
        await LabRecord.create({ userId, labs: {} });
        await Attendance.create({ userId, attendance: {} });
        await AuditLog.create({
          action: 'USER_REGISTER',
          performedBy: `${newUser.fullName} (${newUser.regNumber})`,
          details: `New student account created`
        });
      } catch (e) {
        console.warn('Mongoose create failed, saving to memory store:', e.message);
      }
    }

    // Always store in memory store as backup
    const newUserObj = {
      _id: userId,
      fullName: fullName.trim(),
      regNumber: cleanReg,
      password: hashedPassword,
      role: userRole,
      section: section || '',
      batch: batch || '',
      branch: branch || '',
      lastActive: new Date()
    };
    memoryStore.users.push(newUserObj);
    memoryStore.schedules[userId] = {};
    memoryStore.labs[userId] = {};
    memoryStore.attendance[userId] = {};

    const token = jwt.sign({ id: userId, regNumber: cleanReg, role: userRole }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: userId,
        fullName: fullName.trim(),
        regNumber: cleanReg,
        role: userRole,
        section: section || '',
        batch: batch || '',
        branch: branch || ''
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: error.message || 'Server error during signup' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Registration number/Name and Password are required' });
    }

    const cleanIdentifier = identifier.trim();
    const cleanReg = cleanIdentifier.toUpperCase();
    const cleanName = cleanIdentifier.toLowerCase();
    const isDbConnected = mongoose.connection.readyState === 1;

    let user = null;

    if (isDbConnected) {
      try {
        const escapedIdentifier = cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        user = await User.findOne({
          $or: [
            { regNumber: cleanReg },
            { fullName: new RegExp(`^${escapedIdentifier}$`, 'i') }
          ]
        });
      } catch (dbErr) {
        console.warn('Mongoose user lookup failed:', dbErr.message);
      }
    }

    // Fallback to memory DB
    if (!user) {
      await initMemoryDb();
      user = memoryStore.users.find(u => 
        u.regNumber === cleanReg || u.fullName.toLowerCase() === cleanName
      );
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid registration number/name or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid registration number/name or password' });
    }

    user.lastActive = new Date();
    if (isDbConnected && typeof user.save === 'function') {
      try {
        await user.save();
      } catch (e) {}
    }

    const userId = user._id || user.id;
    const token = jwt.sign({ id: userId, regNumber: user.regNumber, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: userId,
        fullName: user.fullName,
        regNumber: user.regNumber,
        role: user.role,
        section: user.section || '',
        batch: user.batch || '',
        branch: user.branch || '',
        profilePicture: user.profilePicture || ''
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error during login' });
  }
});

export default router;

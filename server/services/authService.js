import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Timetable from '../models/Timetable.js';
import AuditLog from '../models/AuditLog.js';
import { memoryStore } from './memoryDb.js';

const JWT_SECRET = process.env.JWT_SECRET || 'idealab_production_secret_key_2026';

export const signupUser = async ({ fullName, registrationNumber, password, branch, year, section, batch }) => {
  const regUpper = registrationNumber.trim().toUpperCase();

  // Try Mongoose DB
  if (mongoose.connection.readyState === 1) {
    const existing = await User.findOne({ registrationNumber: regUpper });
    if (existing) {
      throw new Error('Registration number is already registered.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName: fullName.trim(),
      registrationNumber: regUpper,
      password: hashedPassword,
      role: 'student',
      branch: branch || 'CSE',
      year: year || '1st Year',
      section: section || 'A',
      batch: batch || '1'
    });

    // Initialize blank timetable
    await Timetable.create({
      userId: user._id,
      monday: {},
      tuesday: {},
      wednesday: {},
      thursday: {},
      friday: {}
    });

    await AuditLog.create({
      action: 'USER_SIGNUP',
      performedBy: user.fullName,
      targetUser: user.registrationNumber,
      details: `Registered new student ${user.fullName} (${user.registrationNumber})`
    }).catch(() => {});

    const token = jwt.sign(
      { id: user._id, regNumber: user.registrationNumber, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        regNumber: user.registrationNumber,
        role: user.role,
        branch: user.branch,
        year: user.year,
        section: user.section,
        batch: user.batch
      }
    };
  }

  // Memory DB Fallback
  if (memoryStore.users[regUpper]) {
    throw new Error('Registration number is already registered.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const memUser = {
    _id: 'mem_' + Date.now(),
    fullName: fullName.trim(),
    registrationNumber: regUpper,
    password: hashedPassword,
    role: 'student',
    branch: branch || 'CSE',
    year: year || '1st Year',
    section: section || 'A',
    batch: batch || '1'
  };

  memoryStore.users[regUpper] = memUser;
  memoryStore.timetables[memUser._id] = { monday: {}, tuesday: {}, wednesday: {}, thursday: {}, friday: {} };

  const token = jwt.sign(
    { id: memUser._id, regNumber: memUser.registrationNumber, role: memUser.role, fullName: memUser.fullName },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return {
    token,
    user: {
      id: memUser._id,
      fullName: memUser.fullName,
      regNumber: memUser.registrationNumber,
      role: memUser.role,
      branch: memUser.branch,
      year: memUser.year,
      section: memUser.section,
      batch: memUser.batch
    }
  };
};

export const loginUser = async ({ registrationNumber, password }) => {
  const regUpper = registrationNumber.trim().toUpperCase();

  // Try Mongoose DB
  if (mongoose.connection.readyState === 1) {
    const user = await User.findOne({ registrationNumber: regUpper });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      await AuditLog.create({
        action: 'USER_LOGIN',
        performedBy: user.fullName,
        targetUser: user.registrationNumber,
        details: `Logged in user ${user.fullName}`
      }).catch(() => {});

      const token = jwt.sign(
        { id: user._id, regNumber: user.registrationNumber, role: user.role, fullName: user.fullName },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          regNumber: user.registrationNumber,
          role: user.role,
          branch: user.branch,
          year: user.year,
          section: user.section,
          batch: user.batch
        }
      };
    }
  }

  // Memory DB Fallback
  const memUser = memoryStore.users[regUpper];
  if (!memUser) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, memUser.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    { id: memUser._id, regNumber: memUser.registrationNumber, role: memUser.role, fullName: memUser.fullName },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return {
    token,
    user: {
      id: memUser._id,
      fullName: memUser.fullName,
      regNumber: memUser.registrationNumber,
      role: memUser.role,
      branch: memUser.branch,
      year: memUser.year,
      section: memUser.section,
      batch: memUser.batch
    }
  };
};

export const getCurrentUser = async (userId) => {
  if (mongoose.connection.readyState === 1) {
    const user = await User.findById(userId).select('-password');
    if (user) return user;
  }

  // Check memory db
  for (const reg in memoryStore.users) {
    if (memoryStore.users[reg]._id === userId) {
      const { password, ...userWithoutPass } = memoryStore.users[reg];
      return userWithoutPass;
    }
  }

  throw new Error('User not found');
};

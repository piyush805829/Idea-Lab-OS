import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import Schedule from '../models/Schedule.js';
import LabRecord from '../models/LabRecord.js';
import Attendance from '../models/Attendance.js';
import Notification from '../models/Notification.js';
import memoryStore from '../services/memoryDb.js';

const router = express.Router();

// GET all data for current student
router.get('/data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const isDbConnected = mongoose.connection.readyState === 1;

    let timetable = {};
    let labs = {};
    let attendance = {};
    let notifications = [];

    if (isDbConnected) {
      let scheduleDoc = await Schedule.findOne({ userId });
      if (!scheduleDoc) scheduleDoc = await Schedule.create({ userId, timetable: {} });

      let labDoc = await LabRecord.findOne({ userId });
      if (!labDoc) labDoc = await LabRecord.create({ userId, labs: {} });

      let attendanceDoc = await Attendance.findOne({ userId });
      if (!attendanceDoc) attendanceDoc = await Attendance.create({ userId, attendance: {} });

      timetable = scheduleDoc.timetable || {};
      labs = labDoc.labs || {};
      attendance = attendanceDoc.attendance || {};
      notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(20);
    } else {
      timetable = memoryStore.schedules[userId] || {};
      labs = memoryStore.labs[userId] || {};
      attendance = memoryStore.attendance[userId] || {};
      notifications = [];
    }

    res.json({
      profile: {
        id: userId,
        fullName: req.user.fullName,
        regNumber: req.user.regNumber,
        role: req.user.role,
        section: req.user.section || '',
        batch: req.user.batch || '',
        branch: req.user.branch || '',
        profilePicture: req.user.profilePicture || ''
      },
      timetable,
      labs,
      attendance,
      notifications
    });
  } catch (error) {
    console.error('Error fetching student data:', error);
    res.status(500).json({ message: 'Error fetching student data' });
  }
});

// UPDATE profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, section, batch, branch, profilePicture } = req.body;
    const userId = req.user._id || req.user.id;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const user = await User.findById(userId);
      if (user) {
        if (fullName) user.fullName = fullName.trim();
        if (section !== undefined) user.section = section;
        if (batch !== undefined) user.batch = batch;
        if (branch !== undefined) user.branch = branch;
        if (profilePicture !== undefined) user.profilePicture = profilePicture;
        await user.save();
      }
    } else {
      const user = memoryStore.users.find(u => (u._id || u.id) === userId);
      if (user) {
        if (fullName) user.fullName = fullName.trim();
        if (section !== undefined) user.section = section;
        if (batch !== undefined) user.batch = batch;
        if (branch !== undefined) user.branch = branch;
        if (profilePicture !== undefined) user.profilePicture = profilePicture;
      }
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// UPDATE timetable
router.put('/timetable', authenticateToken, async (req, res) => {
  try {
    const { timetable } = req.body;
    const userId = req.user._id || req.user.id;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      await Schedule.findOneAndUpdate({ userId }, { timetable }, { upsert: true, new: true });
    } else {
      memoryStore.schedules[userId] = timetable;
    }

    res.json({ message: 'Timetable saved successfully' });
  } catch (error) {
    console.error('Error updating timetable:', error);
    res.status(500).json({ message: 'Error saving timetable' });
  }
});

// UPDATE labs
router.put('/labs', authenticateToken, async (req, res) => {
  try {
    const { labs } = req.body;
    const userId = req.user._id || req.user.id;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      await LabRecord.findOneAndUpdate({ userId }, { labs }, { upsert: true, new: true });
    } else {
      memoryStore.labs[userId] = labs;
    }

    res.json({ message: 'Labs saved successfully' });
  } catch (error) {
    console.error('Error updating labs:', error);
    res.status(500).json({ message: 'Error saving labs' });
  }
});

// UPDATE attendance
router.put('/attendance', authenticateToken, async (req, res) => {
  try {
    const { attendance } = req.body;
    const userId = req.user._id || req.user.id;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      await Attendance.findOneAndUpdate({ userId }, { attendance }, { upsert: true, new: true });
    } else {
      memoryStore.attendance[userId] = attendance;
    }

    res.json({ message: 'Attendance saved successfully' });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: 'Error saving attendance' });
  }
});

export default router;

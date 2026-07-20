import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import Schedule from '../models/Schedule.js';
import SharedSchedule from '../models/SharedSchedule.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// SEARCH student by registration number
router.post('/search', authenticateToken, async (req, res) => {
  try {
    const { regNumber } = req.body;
    if (!regNumber) {
      return res.status(400).json({ message: 'Registration number is required' });
    }

    const cleanReg = regNumber.trim().toUpperCase();
    if (cleanReg === req.user.regNumber) {
      return res.status(400).json({ message: 'You cannot share a timetable with yourself.' });
    }

    const targetUser = await User.findOne({ regNumber: cleanReg }).select('fullName regNumber section batch branch');

    if (!targetUser) {
      return res.status(404).json({ message: 'Student with this Registration Number does not exist.' });
    }

    res.json({
      fullName: targetUser.fullName,
      regNumber: targetUser.regNumber,
      section: targetUser.section,
      batch: targetUser.batch,
      branch: targetUser.branch
    });
  } catch (error) {
    console.error('Error searching student:', error);
    res.status(500).json({ message: 'Error searching student' });
  }
});

// SHARE timetable to a student
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { toRegNumber } = req.body;
    if (!toRegNumber) {
      return res.status(400).json({ message: 'Target registration number required' });
    }

    const cleanReg = toRegNumber.trim().toUpperCase();

    const recipient = await User.findOne({ regNumber: cleanReg });
    if (!recipient) {
      return res.status(404).json({ message: 'Registration number does not exist' });
    }

    // Get current user schedule
    const userSchedule = await Schedule.findOne({ userId: req.user._id });
    if (!userSchedule || !userSchedule.timetable || Object.keys(userSchedule.timetable).length === 0) {
      return res.status(400).json({ message: 'Your timetable is empty. Add classes before sharing.' });
    }

    // Create SharedSchedule record
    const sharedItem = new SharedSchedule({
      fromUserId: req.user._id,
      fromRegNumber: req.user.regNumber,
      fromStudentName: req.user.fullName,
      fromSection: req.user.section || 'N/A',
      toRegNumber: cleanReg,
      timetableData: userSchedule.timetable,
      isImported: false
    });

    await sharedItem.save();

    // Create notification for recipient
    await Notification.create({
      userId: recipient._id,
      title: 'New Timetable Shared',
      message: `${req.user.fullName} (${req.user.regNumber}) shared a timetable schedule with you.`,
      type: 'info'
    });

    res.json({ message: `Timetable successfully shared with ${recipient.fullName}!` });
  } catch (error) {
    console.error('Error sharing timetable:', error);
    res.status(500).json({ message: 'Error sharing timetable' });
  }
});

// GET incoming shared timetables
router.get('/incoming', authenticateToken, async (req, res) => {
  try {
    const sharedList = await SharedSchedule.find({
      toRegNumber: req.user.regNumber,
      isImported: false
    }).sort({ createdAt: -1 });

    res.json(sharedList);
  } catch (error) {
    console.error('Error fetching shared timetables:', error);
    res.status(500).json({ message: 'Error fetching shared timetables' });
  }
});

// IMPORT shared timetable (Duplicate Template)
router.post('/import', authenticateToken, async (req, res) => {
  try {
    const { sharedId } = req.body;
    if (!sharedId) {
      return res.status(400).json({ message: 'Shared ID required' });
    }

    const sharedRecord = await SharedSchedule.findById(sharedId);
    if (!sharedRecord) {
      return res.status(404).json({ message: 'Shared timetable not found' });
    }

    // Duplicate timetable into recipient schedule as independent copy
    let recipientSchedule = await Schedule.findOne({ userId: req.user._id });
    if (!recipientSchedule) {
      recipientSchedule = new Schedule({ userId: req.user._id, timetable: {} });
    }

    // Merge or replace schedule (independent copy)
    recipientSchedule.timetable = {
      ...recipientSchedule.timetable,
      ...sharedRecord.timetableData
    };

    await recipientSchedule.save();

    // Mark imported
    sharedRecord.isImported = true;
    await sharedRecord.save();

    // Send notification
    await Notification.create({
      userId: req.user._id,
      title: 'Timetable Imported',
      message: `Successfully imported timetable schedule from ${sharedRecord.fromStudentName}.`,
      type: 'success'
    });

    res.json({
      message: 'Timetable imported successfully as an independent schedule!',
      timetable: recipientSchedule.timetable
    });
  } catch (error) {
    console.error('Error importing timetable:', error);
    res.status(500).json({ message: 'Error importing timetable' });
  }
});

export default router;

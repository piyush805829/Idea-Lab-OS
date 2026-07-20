import express from 'express';
import mongoose from 'mongoose';
import { 
  getDashboardStats, 
  getAllStudents, 
  getStudentById, 
  searchStudentForIdeaLab,
  markIdeaLabAttendance, 
  getIdeaLabReports 
} from '../services/adminService.js';
import AuditLog from '../models/AuditLog.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

// All admin endpoints require auth + admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/dashboard-stats & /api/admin/dashboard
router.get(['/dashboard-stats', '/dashboard'], async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    return res.json({
      success: true,
      totalStudents: stats.totalStudents,
      todayActive: 0,
      schedulesCreated: stats.totalStudents,
      ideaLabToday: stats.totalIdeaLabPresent,
      stats
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/students
router.get('/students', async (req, res, next) => {
  try {
    const students = await getAllStudents();
    return res.json(students);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/students/:id/details & /api/admin/student/:id
router.get(['/students/:id/details', '/student/:id'], async (req, res, next) => {
  try {
    const studentDetail = await getStudentById(req.params.id);
    return res.json(studentDetail);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/idealab/search & /api/admin/search
router.post(['/idealab/search', '/search'], async (req, res, next) => {
  try {
    const queryStr = req.body.query || req.body.regNumber || req.body.registrationNumber;
    if (!queryStr) {
      return res.status(400).json({ success: false, message: 'Student registration number or name is required.' });
    }

    const result = await searchStudentForIdeaLab(queryStr);
    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
});

// GET /api/admin/templates
router.get('/templates', async (req, res, next) => {
  try {
    return res.json([]);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res, next) => {
  try {
    let logs = [];
    if (mongoose.connection.readyState === 1) {
      logs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);
    }
    return res.json(logs);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/attendance & /api/admin/idealab/mark
router.post(['/attendance', '/idealab/mark'], async (req, res, next) => {
  try {
    const { regNumber, regNo, reason, subject, subjectMissed, teacher, room, slot, lectureTime } = req.body;
    const targetReg = regNumber || regNo;

    if (!targetReg) {
      return res.status(400).json({ success: false, message: 'Registration number is required.' });
    }

    const record = await markIdeaLabAttendance({
      regNumber: targetReg,
      reason,
      subject: subject || subjectMissed,
      teacher,
      room,
      slot: slot || lectureTime,
      markedBy: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: `Idea Lab attendance marked for ${targetReg.toUpperCase()}`,
      record
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/report
router.get('/report', async (req, res, next) => {
  try {
    const report = await getIdeaLabReports();
    return res.json({
      success: true,
      report
    });
  } catch (error) {
    next(error);
  }
});

export default router;

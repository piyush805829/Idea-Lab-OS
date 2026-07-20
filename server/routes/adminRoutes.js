import express from 'express';
import { 
  getDashboardStats, 
  getAllStudents, 
  getStudentById, 
  markIdeaLabAttendance, 
  getIdeaLabReports 
} from '../services/adminService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

// All admin endpoints require auth + admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    return res.json({
      success: true,
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
    return res.json({
      success: true,
      students
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/student/:id
router.get('/student/:id', async (req, res, next) => {
  try {
    const studentDetail = await getStudentById(req.params.id);
    return res.json({
      success: true,
      ...studentDetail
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/attendance
router.post('/attendance', async (req, res, next) => {
  try {
    const { regNumber, reason, subject, teacher, room, slot } = req.body;

    if (!regNumber) {
      return res.status(400).json({ success: false, message: 'Registration number is required.' });
    }

    const record = await markIdeaLabAttendance({
      regNumber,
      reason,
      subject,
      teacher,
      room,
      slot,
      markedBy: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: `Idea Lab attendance marked for ${regNumber.toUpperCase()}`,
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

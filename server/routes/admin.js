import express from 'express';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import Schedule from '../models/Schedule.js';
import LabRecord from '../models/LabRecord.js';
import Attendance from '../models/Attendance.js';
import IdeaLabAttendance from '../models/IdeaLabAttendance.js';
import TimetableTemplate from '../models/TimetableTemplate.js';
import AuditLog from '../models/AuditLog.js';
import memoryStore, { initMemoryDb } from '../services/memoryDb.js';

const router = express.Router();

// Apply auth & admin check to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// 1. ADMIN DASHBOARD ANALYTICS
router.get('/dashboard-stats', async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    let totalStudents = 0;
    let todayActiveStudents = 0;
    let schedulesCreated = 0;
    let pendingLabsCount = 0;
    let todayIdeaLabCount = 0;
    let mostMissedSubjects = [];
    let mostActiveStudents = [];

    if (isDbConnected) {
      try {
        totalStudents = await User.countDocuments({ role: 'student' });
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        todayActiveStudents = await User.countDocuments({
          role: 'student',
          lastActive: { $gte: todayStart }
        });

        schedulesCreated = await Schedule.countDocuments({ timetable: { $ne: {} } });
        todayIdeaLabCount = await IdeaLabAttendance.countDocuments({ date: { $gte: todayStart } });

        const ideaLabRecords = await IdeaLabAttendance.find({});
        const subjectMissedCounts = {};
        ideaLabRecords.forEach(rec => {
          if (rec.subjectMissed) {
            subjectMissedCounts[rec.subjectMissed] = (subjectMissedCounts[rec.subjectMissed] || 0) + 1;
          }
        });

        mostMissedSubjects = Object.entries(subjectMissedCounts)
          .map(([subject, count]) => ({ subject, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        mostActiveStudents = await User.find({ role: 'student' })
          .sort({ updatedAt: -1 })
          .limit(5)
          .select('fullName regNumber branch section lastActive');
      } catch (e) {
        console.warn('Mongoose stats calculation failed, falling back to memory store:', e.message);
      }
    }

    if (totalStudents === 0) {
      await initMemoryDb();
      const studentList = memoryStore.users.filter(u => u.role === 'student');
      totalStudents = studentList.length;
      todayActiveStudents = studentList.length;
      schedulesCreated = Object.keys(memoryStore.schedules).length;
      todayIdeaLabCount = memoryStore.ideaLabRecords.length;
      mostActiveStudents = studentList.map(u => ({
        id: u._id || u.id,
        _id: u._id || u.id,
        fullName: u.fullName,
        regNumber: u.regNumber,
        branch: u.branch || '',
        section: u.section || '',
        lastActive: u.lastActive || new Date()
      }));
    }

    res.json({
      totalStudents,
      todayActiveStudents,
      schedulesCreated,
      pendingLabsCount,
      todayIdeaLabCount,
      mostMissedSubjects,
      mostActiveStudents
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching admin stats' });
  }
});

// 2. STUDENT DIRECTORY SEARCH & VIEW
router.get('/students', async (req, res) => {
  try {
    const { query } = req.query;
    const isDbConnected = mongoose.connection.readyState === 1;

    let students = [];

    if (isDbConnected) {
      try {
        let filter = { role: 'student' };
        if (query) {
          const regex = new RegExp(query, 'i');
          filter.$or = [{ regNumber: regex }, { fullName: regex }];
        }
        students = await User.find(filter)
          .select('fullName regNumber section batch branch profilePicture lastActive createdAt')
          .sort({ fullName: 1 });
      } catch (dbErr) {
        console.warn('Mongoose students lookup failed:', dbErr.message);
      }
    }

    if (!students || students.length === 0) {
      await initMemoryDb();
      const q = (query || '').toLowerCase();
      students = memoryStore.users
        .filter(u => u.role === 'student')
        .filter(u => !q || u.fullName.toLowerCase().includes(q) || u.regNumber.toLowerCase().includes(q))
        .map(u => ({
          id: u._id || u.id,
          _id: u._id || u.id,
          fullName: u.fullName,
          regNumber: u.regNumber,
          section: u.section || '',
          batch: u.batch || '',
          branch: u.branch || '',
          profilePicture: u.profilePicture || '',
          lastActive: u.lastActive || new Date()
        }));
    }

    res.json(students);
  } catch (error) {
    console.error('Error fetching student directory:', error);
    res.status(500).json({ message: 'Error fetching directory' });
  }
});

// Get specific student full details (view only timetable, labs, attendance)
router.get('/students/:id/details', async (req, res) => {
  try {
    const targetId = req.params.id;
    const isDbConnected = mongoose.connection.readyState === 1;

    let student = null;
    let timetable = {};
    let labs = {};
    let attendance = {};

    if (isDbConnected) {
      try {
        if (mongoose.Types.ObjectId.isValid(targetId)) {
          student = await User.findById(targetId).select('-password');
        }
        if (!student) {
          student = await User.findOne({ regNumber: targetId.toUpperCase() }).select('-password');
        }

        if (student) {
          const scheduleDoc = await Schedule.findOne({ userId: student._id });
          const labDoc = await LabRecord.findOne({ userId: student._id });
          const attendanceDoc = await Attendance.findOne({ userId: student._id });

          timetable = scheduleDoc ? scheduleDoc.timetable : {};
          labs = labDoc ? labDoc.labs : {};
          attendance = attendanceDoc ? attendanceDoc.attendance : {};
        }
      } catch (dbErr) {
        console.warn('Mongoose student details lookup failed:', dbErr.message);
      }
    }

    if (!student) {
      await initMemoryDb();
      student = memoryStore.users.find(u => 
        (u._id || u.id) === targetId || u.regNumber === targetId.toUpperCase()
      );
      if (student) {
        const uId = student._id || student.id;
        timetable = memoryStore.schedules[uId] || {};
        labs = memoryStore.labs[uId] || {};
        attendance = memoryStore.attendance[uId] || {};
      }
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      student: {
        id: student._id || student.id,
        fullName: student.fullName,
        regNumber: student.regNumber,
        role: student.role,
        section: student.section || '',
        batch: student.batch || '',
        branch: student.branch || ''
      },
      timetable,
      labs,
      attendance
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ message: 'Error fetching student details' });
  }
});

// 3. IDEA LAB ATTENDANCE SEARCH & ENTRY
router.post('/idealab/search', async (req, res) => {
  try {
    const { regNumber } = req.body;
    if (!regNumber) return res.status(400).json({ message: 'Registration number required' });

    const cleanReg = regNumber.trim().toUpperCase();
    const isDbConnected = mongoose.connection.readyState === 1;

    let student = null;
    let timetable = {};

    if (isDbConnected) {
      try {
        student = await User.findOne({ regNumber: cleanReg }).select('-password');
        if (student) {
          const scheduleDoc = await Schedule.findOne({ userId: student._id });
          timetable = scheduleDoc ? scheduleDoc.timetable : {};
        }
      } catch (e) {}
    }

    if (!student) {
      await initMemoryDb();
      student = memoryStore.users.find(u => u.regNumber === cleanReg);
      if (student) {
        const uId = student._id || student.id;
        timetable = memoryStore.schedules[uId] || {};
      }
    }

    if (!student) return res.status(404).json({ message: 'Student not found' });

    res.json({
      student: {
        id: student._id || student.id,
        fullName: student.fullName,
        regNumber: student.regNumber,
        section: student.section || '',
        batch: student.batch || '',
        branch: student.branch || ''
      },
      timetable
    });
  } catch (error) {
    console.error('Error searching student for Idea Lab:', error);
    res.status(500).json({ message: 'Error searching student' });
  }
});

router.post('/idealab/mark', async (req, res) => {
  try {
    const {
      studentName,
      regNumber,
      department,
      section,
      batch,
      subjectMissed,
      teacher,
      room,
      lectureTime,
      reason
    } = req.body;

    if (!studentName || !regNumber || !subjectMissed) {
      return res.status(400).json({ message: 'Student name, reg number, and subject missed are required' });
    }

    const now = new Date();
    const attendanceTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      try {
        const record = new IdeaLabAttendance({
          studentName,
          regNumber: regNumber.toUpperCase(),
          department: department || '',
          section: section || '',
          batch: batch || '',
          subjectMissed,
          teacher: teacher || '',
          room: room || '',
          lectureTime: lectureTime || '',
          date: now,
          attendanceTime: attendanceTimeStr,
          reason: reason || 'Idea Lab Work',
          status: 'Present'
        });
        await record.save();

        await AuditLog.create({
          action: 'IDEALAB_ATTENDANCE_MARK',
          performedBy: `${req.user.fullName} (Admin)`,
          details: `Marked Idea Lab attendance for ${studentName} (${regNumber}) - ${subjectMissed}`
        });
      } catch (e) {}
    }

    // Always record in memoryStore as backup
    memoryStore.ideaLabRecords.push({
      studentName,
      regNumber: regNumber.toUpperCase(),
      department: department || '',
      section: section || '',
      batch: batch || '',
      subjectMissed,
      teacher: teacher || '',
      room: room || '',
      lectureTime: lectureTime || '',
      date: now,
      attendanceTime: attendanceTimeStr,
      reason: reason || 'Idea Lab Work',
      status: 'Present'
    });

    res.status(201).json({
      message: `Idea Lab Attendance recorded for ${studentName}!`,
      record: { studentName, regNumber, subjectMissed, status: 'Present' }
    });
  } catch (error) {
    console.error('Error marking Idea Lab attendance:', error);
    res.status(500).json({ message: 'Error marking attendance' });
  }
});

// 4. EXCEL REPORT GENERATION
router.get('/idealab/export', async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const isDbConnected = mongoose.connection.readyState === 1;

    let records = [];

    if (isDbConnected) {
      try {
        let filter = {};
        const now = new Date();

        if (range === 'today') {
          const startOfDay = new Date(now.setHours(0, 0, 0, 0));
          const endOfDay = new Date(now.setHours(23, 59, 59, 999));
          filter.date = { $gte: startOfDay, $lte: endOfDay };
        } else if (range === 'week') {
          const startOfWeek = new Date();
          startOfWeek.setDate(now.getDate() - 7);
          filter.date = { $gte: startOfWeek };
        } else if (range === 'month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          filter.date = { $gte: startOfMonth };
        } else if (range === 'custom' && startDate && endDate) {
          filter.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }

        records = await IdeaLabAttendance.find(filter).sort({ date: -1 });
      } catch (e) {}
    }

    if (!records || records.length === 0) {
      await initMemoryDb();
      records = memoryStore.ideaLabRecords;
    }

    const excelRows = records.map(r => ({
      'Student Name': r.studentName,
      'Registration Number': r.regNumber,
      'Department': r.department || 'N/A',
      'Section': r.section || 'N/A',
      'Batch': r.batch || 'N/A',
      'Subject Missed': r.subjectMissed,
      'Teacher': r.teacher || 'N/A',
      'Room': r.room || 'N/A',
      'Lecture Time': r.lectureTime || 'N/A',
      'Date': r.date ? new Date(r.date).toLocaleDateString('en-US') : new Date().toLocaleDateString('en-US'),
      'Attendance Time': r.attendanceTime || 'N/A',
      'Reason': r.reason,
      'Status': r.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'IdeaLabAttendance');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=IdeaLab_Attendance_Report_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting excel report:', error);
    res.status(500).json({ message: 'Error generating Excel report' });
  }
});

// 5. TIMETABLE TEMPLATES
router.get('/templates', async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    let templates = [];

    if (isDbConnected) {
      try {
        templates = await TimetableTemplate.find({}).sort({ createdAt: -1 });
      } catch (e) {}
    }

    if (!templates || templates.length === 0) {
      await initMemoryDb();
      templates = memoryStore.templates;
    }

    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching templates' });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const { title, branch, section, timetableData } = req.body;
    if (!title || !timetableData) {
      return res.status(400).json({ message: 'Title and timetable data required' });
    }

    const templateObj = {
      _id: `tpl_${Date.now()}`,
      title,
      branch: branch || '',
      section: section || '',
      timetableData,
      createdBy: req.user.fullName
    };

    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      try {
        const template = new TimetableTemplate(templateObj);
        await template.save();
      } catch (e) {}
    }

    memoryStore.templates.push(templateObj);
    res.status(201).json(templateObj);
  } catch (error) {
    res.status(500).json({ message: 'Error creating template' });
  }
});

// 6. AUDIT LOGS
router.get('/audit-logs', async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    let logs = [];

    if (isDbConnected) {
      try {
        logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(100);
      } catch (e) {}
    }

    if (!logs || logs.length === 0) {
      await initMemoryDb();
      logs = memoryStore.auditLogs;
    }

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
});

export default router;

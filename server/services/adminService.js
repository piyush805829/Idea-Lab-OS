import mongoose from 'mongoose';
import User from '../models/User.js';
import Timetable from '../models/Timetable.js';
import IdeaLabAttendance from '../models/IdeaLabAttendance.js';
import AuditLog from '../models/AuditLog.js';
import { memoryStore } from './memoryDb.js';

// Helper to safely convert Mongoose Map / Object into flat timetable keys
const safeFlattenTimetableDoc = (ttDoc) => {
  if (!ttDoc) return {};
  const timetable = {};
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  days.forEach((d) => {
    const dayObj = ttDoc[d];
    if (dayObj) {
      if (dayObj instanceof Map) {
        Object.assign(timetable, Object.fromEntries(dayObj));
      } else if (typeof dayObj === 'object') {
        Object.assign(timetable, dayObj);
      }
    }
  });

  return timetable;
};

export const getDashboardStats = async () => {
  if (mongoose.connection.readyState === 1) {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalIdeaLabPresent = await IdeaLabAttendance.countDocuments();
    const activeLabsCount = 5;
    const systemStatus = 'Operational (MongoDB Atlas)';

    return {
      totalStudents,
      totalIdeaLabPresent,
      activeLabsCount,
      systemStatus
    };
  }

  // Memory DB Fallback
  const totalStudents = Object.values(memoryStore.users).filter((u) => u.role === 'student').length;
  const totalIdeaLabPresent = memoryStore.ideaLabAttendance.length;

  return {
    totalStudents,
    totalIdeaLabPresent,
    activeLabsCount: 5,
    systemStatus: 'Operational (Memory DB)'
  };
};

export const getAllStudents = async () => {
  if (mongoose.connection.readyState === 1) {
    const students = await User.find({ role: 'student' }).select('-password').sort({ fullName: 1 });
    return students;
  }

  // Memory DB Fallback
  return Object.values(memoryStore.users)
    .filter((u) => u.role === 'student')
    .map(({ password, ...rest }) => rest);
};

export const getStudentById = async (studentIdOrReg) => {
  let student = null;
  let timetable = {};
  let labs = {};
  let attendance = {};

  if (mongoose.connection.readyState === 1) {
    if (mongoose.Types.ObjectId.isValid(studentIdOrReg)) {
      student = await User.findById(studentIdOrReg).select('-password');
    }
    if (!student) {
      student = await User.findOne({ registrationNumber: studentIdOrReg.toUpperCase() }).select('-password');
    }

    if (student) {
      const tt = await Timetable.findOne({ userId: student._id });
      timetable = safeFlattenTimetableDoc(tt);
      return { student, timetable, labs, attendance };
    }
  }

  // Memory DB Fallback
  for (const reg in memoryStore.users) {
    const u = memoryStore.users[reg];
    if (u._id === studentIdOrReg || u.registrationNumber === studentIdOrReg.toUpperCase()) {
      const { password, ...st } = u;
      const memTt = memoryStore.timetables[u._id] || {};
      timetable = safeFlattenTimetableDoc(memTt);
      return { student: st, timetable, labs, attendance };
    }
  }

  throw new Error('Student profile not found.');
};

export const searchStudentForIdeaLab = async (queryStr) => {
  const q = (queryStr || '').trim();
  if (!q) throw new Error('Search query is required.');

  const qUpper = q.toUpperCase();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  if (mongoose.connection.readyState === 1) {
    const students = await User.find({
      role: 'student',
      $or: [
        { registrationNumber: new RegExp(q, 'i') },
        { fullName: new RegExp(q, 'i') }
      ]
    }).select('-password');

    if (!students || students.length === 0) {
      throw new Error(`No student found matching "${q}".`);
    }

    const student = students.find(s => s.registrationNumber.toUpperCase() === qUpper) || students[0];

    const tt = await Timetable.findOne({ userId: student._id });
    const timetable = safeFlattenTimetableDoc(tt);

    // Fetch today's marked attendance slots for this student
    const markedRecords = await IdeaLabAttendance.find({
      regNumber: student.registrationNumber,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    const markedSlots = markedRecords.map(r => r.slot);

    const profile = {
      id: student._id,
      fullName: student.fullName,
      regNumber: student.registrationNumber,
      role: student.role,
      section: student.section || 'A',
      batch: student.batch || '1',
      branch: student.branch || 'CSE'
    };

    return {
      student: profile,
      timetable,
      markedSlots,
      matchingStudents: students.map(s => ({
        id: s._id,
        fullName: s.fullName,
        regNumber: s.registrationNumber,
        section: s.section,
        branch: s.branch
      }))
    };
  }

  // Memory DB Fallback
  const matching = Object.values(memoryStore.users).filter(u => 
    u.role === 'student' && (
      u.registrationNumber.toUpperCase().includes(qUpper) || 
      u.fullName.toLowerCase().includes(q.toLowerCase())
    )
  );

  if (matching.length === 0) {
    throw new Error(`No student found matching "${q}".`);
  }

  const student = matching.find(s => s.registrationNumber.toUpperCase() === qUpper) || matching[0];
  const memTt = memoryStore.timetables[student._id] || {};
  const timetable = safeFlattenTimetableDoc(memTt);

  const markedSlots = memoryStore.ideaLabAttendance
    .filter(r => r.regNumber.toUpperCase() === student.registrationNumber.toUpperCase())
    .map(r => r.slot);

  return {
    student: {
      id: student._id,
      fullName: student.fullName,
      regNumber: student.registrationNumber,
      role: student.role,
      section: student.section || 'A',
      batch: student.batch || '1',
      branch: student.branch || 'CSE'
    },
    timetable,
    markedSlots,
    matchingStudents: matching.map(s => ({
      id: s._id,
      fullName: s.fullName,
      regNumber: s.registrationNumber,
      section: s.section,
      branch: s.branch
    }))
  };
};

export const markIdeaLabAttendance = async ({ regNumber, reason, subject, teacher, room, slot, markedBy }) => {
  const regUpper = (regNumber || '').trim().toUpperCase();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  if (mongoose.connection.readyState === 1) {
    let student = await User.findOne({ registrationNumber: regUpper });
    if (!student) {
      student = await User.findOne({ fullName: new RegExp(regNumber, 'i') });
    }
    if (!student) {
      throw new Error(`Student "${regNumber}" not found.`);
    }

    let record = await IdeaLabAttendance.findOne({
      regNumber: student.registrationNumber,
      slot: slot || 'Slot 1',
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (record) {
      record.reason = reason || 'Idea Lab Work';
      record.subject = subject || record.subject || 'Idea Lab Work';
      record.teacher = teacher || record.teacher;
      record.room = room || record.room;
      await record.save();
    } else {
      record = await IdeaLabAttendance.create({
        studentId: student._id,
        regNumber: student.registrationNumber,
        studentName: student.fullName,
        section: student.section || 'A',
        branch: student.branch || 'CSE',
        date: new Date(),
        reason: reason || 'Idea Lab Work',
        subject: subject || 'Idea Lab Work',
        teacher: teacher || 'Instructor',
        room: room || 'Idea Lab',
        slot: slot || 'Slot 1',
        markedBy
      });
    }

    await AuditLog.create({
      action: 'MARKED_IDEALAB_ATTENDANCE',
      performedBy: 'Admin',
      targetUser: student.registrationNumber,
      details: `Marked Idea Lab attendance for ${student.fullName} (${slot || 'Slot 1'})`
    }).catch(() => {});

    return record;
  }

  // Memory DB Fallback
  const student = memoryStore.users[regUpper] || Object.values(memoryStore.users).find(u => u.fullName.toLowerCase() === regNumber.toLowerCase());
  if (!student) {
    throw new Error(`Student "${regNumber}" not found.`);
  }

  memoryStore.ideaLabAttendance = memoryStore.ideaLabAttendance.filter(
    r => !(r.regNumber.toUpperCase() === student.registrationNumber.toUpperCase() && r.slot === slot)
  );

  const record = {
    _id: 'idealab_' + Date.now(),
    studentId: student._id,
    regNumber: student.registrationNumber,
    studentName: student.fullName,
    section: student.section || 'A',
    branch: student.branch || 'CSE',
    date: new Date().toISOString(),
    reason: reason || 'Idea Lab Work',
    subject: subject || 'Idea Lab Work',
    teacher: teacher || 'Instructor',
    room: room || 'Idea Lab',
    slot: slot || 'Slot 1',
    createdAt: new Date().toISOString()
  };

  memoryStore.ideaLabAttendance.push(record);
  return record;
};

export const cancelIdeaLabAttendance = async ({ regNumber, slot, subject }) => {
  const regUpper = (regNumber || '').trim().toUpperCase();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  if (mongoose.connection.readyState === 1) {
    let student = await User.findOne({ registrationNumber: regUpper });
    if (!student) {
      student = await User.findOne({ fullName: new RegExp(regNumber, 'i') });
    }
    const targetReg = student ? student.registrationNumber : regUpper;

    await IdeaLabAttendance.deleteMany({
      regNumber: targetReg,
      slot: slot || 'Slot 1',
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    await AuditLog.create({
      action: 'CANCELLED_IDEALAB_ATTENDANCE',
      performedBy: 'Admin',
      targetUser: targetReg,
      details: `Cancelled Idea Lab attendance for ${targetReg} (${slot || subject})`
    }).catch(() => {});

    return { success: true, message: `Attendance cancelled for ${targetReg}` };
  }

  // Memory DB Fallback
  memoryStore.ideaLabAttendance = memoryStore.ideaLabAttendance.filter(
    r => !(r.regNumber.toUpperCase() === regUpper && r.slot === slot)
  );
  return { success: true, message: `Attendance cancelled for ${regUpper}` };
};

export const getIdeaLabReports = async () => {
  let records = [];

  if (mongoose.connection.readyState === 1) {
    records = await IdeaLabAttendance.find().sort({ date: -1 });
  } else {
    records = memoryStore.ideaLabAttendance;
  }

  const seenKeys = new Set();
  const formattedReport = [];

  for (const r of records) {
    const dt = new Date(r.date || r.createdAt);
    const dateFormatted = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
    const slotLabel = r.slot || r.subject || 'Slot 1';
    const uniqueKey = `${r.regNumber}_${dateFormatted}_${slotLabel}`;

    if (!seenKeys.has(uniqueKey)) {
      seenKeys.add(uniqueKey);
      formattedReport.push({
        Name: r.studentName || 'N/A',
        'Reg No': r.regNumber || 'N/A',
        Date: dateFormatted,
        'Time Slot': slotLabel
      });
    }
  }

  return formattedReport;
};

export const batchMarkIdeaLabAttendance = async ({ regNumbers, reason, subject, teacher, room, slot, markedBy }) => {
  if (!Array.isArray(regNumbers) || regNumbers.length === 0) {
    throw new Error('At least one student registration number is required.');
  }

  const results = [];
  for (const reg of regNumbers) {
    try {
      const rec = await markIdeaLabAttendance({
        regNumber: reg,
        reason,
        subject: subject || 'Idea Lab Work',
        teacher,
        room,
        slot,
        markedBy
      });
      results.push(rec);
    } catch (e) {
      console.warn(`Failed to mark attendance for ${reg}:`, e.message);
    }
  }

  return {
    count: results.length,
    records: results
  };
};

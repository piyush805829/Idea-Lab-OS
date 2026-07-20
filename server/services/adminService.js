import mongoose from 'mongoose';
import User from '../models/User.js';
import Timetable from '../models/Timetable.js';
import IdeaLabAttendance from '../models/IdeaLabAttendance.js';
import AuditLog from '../models/AuditLog.js';
import { memoryStore } from './memoryDb.js';

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
      if (tt) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        days.forEach((d) => {
          if (tt[d]) {
            const mapObj = Object.fromEntries(tt[d] || new Map());
            Object.assign(timetable, mapObj);
          }
        });
      }
      return { student, timetable, labs, attendance };
    }
  }

  // Memory DB Fallback
  for (const reg in memoryStore.users) {
    const u = memoryStore.users[reg];
    if (u._id === studentIdOrReg || u.registrationNumber === studentIdOrReg.toUpperCase()) {
      const { password, ...st } = u;
      const memTt = memoryStore.timetables[u._id] || {};
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach((d) => {
        if (memTt[d]) Object.assign(timetable, memTt[d]);
      });
      return { student: st, timetable, labs, attendance };
    }
  }

  throw new Error('Student profile not found.');
};

export const searchStudentForIdeaLab = async (queryStr) => {
  const q = (queryStr || '').trim();
  if (!q) throw new Error('Search query is required.');

  const qUpper = q.toUpperCase();

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
    let timetable = {};
    if (tt) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      days.forEach((d) => {
        if (tt[d]) {
          const mapObj = Object.fromEntries(tt[d] || new Map());
          Object.assign(timetable, mapObj);
        }
      });
    }

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
  let timetable = {};
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach((d) => {
    if (memTt[d]) Object.assign(timetable, memTt[d]);
  });

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

  if (mongoose.connection.readyState === 1) {
    let student = await User.findOne({ registrationNumber: regUpper });
    if (!student) {
      student = await User.findOne({ fullName: new RegExp(regNumber, 'i') });
    }
    if (!student) {
      throw new Error(`Student "${regNumber}" not found.`);
    }

    const record = await IdeaLabAttendance.create({
      studentId: student._id,
      regNumber: student.registrationNumber,
      studentName: student.fullName,
      section: student.section || 'A',
      branch: student.branch || 'CSE',
      date: new Date(),
      reason: reason || 'Idea Lab Work',
      subject: subject || 'General',
      teacher: teacher || 'Instructor',
      room: room || 'Idea Lab',
      slot: slot || 'Slot 1',
      markedBy
    });

    await AuditLog.create({
      action: 'MARKED_IDEALAB_ATTENDANCE',
      performedBy: 'Admin',
      targetUser: student.registrationNumber,
      details: `Marked Idea Lab attendance for ${student.fullName} (${subject || 'General'})`
    }).catch(() => {});

    return record;
  }

  // Memory DB Fallback
  const student = memoryStore.users[regUpper] || Object.values(memoryStore.users).find(u => u.fullName.toLowerCase() === regNumber.toLowerCase());
  if (!student) {
    throw new Error(`Student "${regNumber}" not found.`);
  }

  const record = {
    _id: 'idealab_' + Date.now(),
    studentId: student._id,
    regNumber: student.registrationNumber,
    studentName: student.fullName,
    section: student.section || 'A',
    branch: student.branch || 'CSE',
    date: new Date().toISOString(),
    reason: reason || 'Idea Lab Work',
    subject: subject || 'General',
    teacher: teacher || 'Instructor',
    room: room || 'Idea Lab',
    slot: slot || 'Slot 1',
    createdAt: new Date().toISOString()
  };

  memoryStore.ideaLabAttendance.push(record);
  return record;
};

export const getIdeaLabReports = async () => {
  let records = [];

  if (mongoose.connection.readyState === 1) {
    records = await IdeaLabAttendance.find().sort({ date: -1 });
  } else {
    records = memoryStore.ideaLabAttendance;
  }

  const formattedReport = records.map((r) => {
    const dt = new Date(r.date || r.createdAt);
    const dateFormatted = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;

    return {
      Name: r.studentName || 'N/A',
      'Reg No': r.regNumber || 'N/A',
      Date: dateFormatted,
      'Time Slot': r.slot || r.subject || 'Slot 1'
    };
  });

  return formattedReport;
};

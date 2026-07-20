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
    const activeLabsCount = 5; // Configured labs count
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
        // Flatten weekly map keys into key-value map
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

export const markIdeaLabAttendance = async ({ regNumber, reason, subject, teacher, room, slot, markedBy }) => {
  const regUpper = regNumber.trim().toUpperCase();

  if (mongoose.connection.readyState === 1) {
    const student = await User.findOne({ registrationNumber: regUpper });
    if (!student) {
      throw new Error(`Student with Reg Number "${regUpper}" not found.`);
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
      details: `Marked Idea Lab attendance for ${student.fullName} (${subject})`
    }).catch(() => {});

    return record;
  }

  // Memory DB Fallback
  const student = memoryStore.users[regUpper];
  if (!student) {
    throw new Error(`Student with Reg Number "${regUpper}" not found.`);
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

  // Format explicitly into requested 4-column structure: Name | Reg No | Date | Time Slot
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

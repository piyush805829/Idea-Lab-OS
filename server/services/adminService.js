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

export const getAllStudents = async (queryStr = '') => {
  const q = (queryStr || '').trim();

  if (mongoose.connection.readyState === 1) {
    let filter = { role: 'student' };
    if (q) {
      filter.$or = [
        { registrationNumber: new RegExp(q, 'i') },
        { fullName: new RegExp(q, 'i') }
      ];
    }
    const students = await User.find(filter).select('-password').sort({ fullName: 1 }).lean();
    return students.map(s => ({
      id: s._id.toString(),
      _id: s._id.toString(),
      fullName: s.fullName,
      regNumber: s.registrationNumber || s.regNumber,
      registrationNumber: s.registrationNumber || s.regNumber,
      role: s.role,
      section: s.section || 'A',
      batch: s.batch || '1',
      branch: s.branch || 'CSE'
    }));
  }

  // Memory DB Fallback
  return Object.values(memoryStore.users)
    .filter((u) => u.role === 'student' && (
      !q ||
      (u.registrationNumber && u.registrationNumber.toUpperCase().includes(q.toUpperCase())) ||
      (u.fullName && u.fullName.toLowerCase().includes(q.toLowerCase()))
    ))
    .map(({ password, ...u }) => ({
      ...u,
      regNumber: u.registrationNumber || u.regNumber,
      registrationNumber: u.registrationNumber || u.regNumber
    }));
};

export const getStudentById = async (studentIdOrReg) => {
  let student = null;
  let timetable = {};
  let labs = {};
  let attendance = {};

  if (mongoose.connection.readyState === 1) {
    if (mongoose.Types.ObjectId.isValid(studentIdOrReg)) {
      student = await User.findById(studentIdOrReg).select('-password').lean();
    }
    if (!student) {
      student = await User.findOne({ registrationNumber: studentIdOrReg.toUpperCase() }).select('-password').lean();
    }

    if (student) {
      const tt = await Timetable.findOne({ userId: student._id });
      timetable = safeFlattenTimetableDoc(tt);

      const profile = {
        id: student._id.toString(),
        _id: student._id.toString(),
        fullName: student.fullName,
        regNumber: student.registrationNumber || student.regNumber,
        registrationNumber: student.registrationNumber || student.regNumber,
        role: student.role,
        section: student.section || 'A',
        batch: student.batch || '1',
        branch: student.branch || 'CSE'
      };

      return { student: profile, timetable, labs, attendance };
    }
  }

  // Memory DB Fallback
  for (const reg in memoryStore.users) {
    const u = memoryStore.users[reg];
    if (u._id === studentIdOrReg || u.registrationNumber === studentIdOrReg.toUpperCase()) {
      const { password, ...st } = u;
      const memTt = memoryStore.timetables[u._id] || {};
      timetable = safeFlattenTimetableDoc(memTt);
      const profile = {
        ...st,
        regNumber: st.registrationNumber || st.regNumber,
        registrationNumber: st.registrationNumber || st.regNumber
      };
      return { student: profile, timetable, labs, attendance };
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
    }).select('-password').lean();

    if (!students || students.length === 0) {
      throw new Error(`No student found matching "${q}".`);
    }

    const student = students.find(s => (s.registrationNumber || '').toUpperCase() === qUpper) || students[0];

    const tt = await Timetable.findOne({ userId: student._id });
    const timetable = safeFlattenTimetableDoc(tt);

    // Fetch today's marked attendance slots for this student
    const markedRecords = await IdeaLabAttendance.find({
      regNumber: student.registrationNumber,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const markedSlots = [];
    markedRecords.forEach(r => {
      if (r.slot) markedSlots.push(r.slot);
      if (r.lectureTime) markedSlots.push(r.lectureTime);
      if (r.subject) markedSlots.push(r.subject);
    });

    const profile = {
      id: student._id.toString(),
      _id: student._id.toString(),
      fullName: student.fullName,
      regNumber: student.registrationNumber,
      registrationNumber: student.registrationNumber,
      role: student.role,
      section: student.section || 'A',
      batch: student.batch || '1',
      branch: student.branch || 'CSE'
    };

    return {
      student: profile,
      timetable,
      markedSlots: Array.from(new Set(markedSlots)),
      matchingStudents: students.map(s => ({
        id: s._id.toString(),
        fullName: s.fullName,
        regNumber: s.registrationNumber,
        registrationNumber: s.registrationNumber,
        section: s.section,
        branch: s.branch
      }))
    };
  }

  // Memory DB Fallback
  const matching = Object.values(memoryStore.users).filter(u => 
    u.role === 'student' && (
      (u.registrationNumber && u.registrationNumber.toUpperCase().includes(qUpper)) || 
      (u.fullName && u.fullName.toLowerCase().includes(q.toLowerCase()))
    )
  );

  if (matching.length === 0) {
    throw new Error(`No student found matching "${q}".`);
  }

  const student = matching.find(s => s.registrationNumber.toUpperCase() === qUpper) || matching[0];
  const memTt = memoryStore.timetables[student._id] || {};
  const timetable = safeFlattenTimetableDoc(memTt);

  const markedSlots = [];
  memoryStore.ideaLabAttendance
    .filter(r => r.regNumber.toUpperCase() === student.registrationNumber.toUpperCase())
    .forEach(r => {
      if (r.slot) markedSlots.push(r.slot);
      if (r.lectureTime) markedSlots.push(r.lectureTime);
      if (r.subject) markedSlots.push(r.subject);
    });

  return {
    student: {
      id: student._id,
      fullName: student.fullName,
      regNumber: student.registrationNumber,
      registrationNumber: student.registrationNumber,
      role: student.role,
      section: student.section || 'A',
      batch: student.batch || '1',
      branch: student.branch || 'CSE'
    },
    timetable,
    markedSlots: Array.from(new Set(markedSlots)),
    matchingStudents: matching.map(s => ({
      id: s._id,
      fullName: s.fullName,
      regNumber: s.registrationNumber,
      registrationNumber: s.registrationNumber,
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

    const possibleSlots = Array.from(new Set([slot, subject, 'Slot 1'].filter(Boolean)));

    let record = await IdeaLabAttendance.findOne({
      regNumber: student.registrationNumber,
      date: { $gte: startOfDay, $lte: endOfDay },
      $or: [
        { slot: { $in: possibleSlots } },
        { lectureTime: { $in: possibleSlots } }
      ]
    });

    if (record) {
      record.reason = reason || 'Idea Lab Work';
      record.subject = subject || record.subject || 'Idea Lab Work';
      record.teacher = teacher || record.teacher;
      record.room = room || record.room;
      record.slot = slot || record.slot;
      record.lectureTime = slot || record.lectureTime;
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
        lectureTime: slot || 'Slot 1',
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
    r => !(r.regNumber.toUpperCase() === student.registrationNumber.toUpperCase() && (r.slot === slot || r.subject === subject))
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
    lectureTime: slot || 'Slot 1',
    createdAt: new Date().toISOString()
  };

  memoryStore.ideaLabAttendance.push(record);
  return record;
};

export const cancelIdeaLabAttendance = async ({ regNumber, slot, subject, slotKey, timeLabel, lectureTime }) => {
  const regUpper = (regNumber || '').trim().toUpperCase();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const possibleMatches = Array.from(new Set([
    slot,
    slotKey,
    timeLabel,
    lectureTime,
    subject
  ].filter(Boolean)));

  if (mongoose.connection.readyState === 1) {
    let student = await User.findOne({ registrationNumber: regUpper });
    if (!student) {
      student = await User.findOne({ fullName: new RegExp(regNumber, 'i') });
    }
    const targetReg = student ? student.registrationNumber : regUpper;

    const deleteFilter = {
      regNumber: targetReg,
      date: { $gte: startOfDay, $lte: endOfDay }
    };

    if (possibleMatches.length > 0) {
      deleteFilter.$or = [
        { slot: { $in: possibleMatches } },
        { lectureTime: { $in: possibleMatches } },
        { subject: { $in: possibleMatches } }
      ];
    }

    await IdeaLabAttendance.deleteMany(deleteFilter);

    await AuditLog.create({
      action: 'CANCELLED_IDEALAB_ATTENDANCE',
      performedBy: 'Admin',
      targetUser: targetReg,
      details: `Cancelled Idea Lab attendance for ${targetReg} (${slot || subject || 'Slot'})`
    }).catch(() => {});

    return { success: true, message: `Attendance cancelled for ${targetReg}` };
  }

  // Memory DB Fallback
  memoryStore.ideaLabAttendance = memoryStore.ideaLabAttendance.filter(r => {
    if (r.regNumber.toUpperCase() !== regUpper) return true;
    const dt = new Date(r.date || r.createdAt);
    if (dt < startOfDay || dt > endOfDay) return true;
    return !possibleMatches.includes(r.slot) && !possibleMatches.includes(r.subject) && !possibleMatches.includes(r.lectureTime);
  });

  return { success: true, message: `Attendance cancelled for ${regUpper}` };
};

export const getIdeaLabReports = async () => {
  let records = [];

  if (mongoose.connection.readyState === 1) {
    records = await IdeaLabAttendance.find().sort({ date: -1 });
  } else {
    records = memoryStore.ideaLabAttendance;
  }

  // Group records by Reg No + Date (1 single row per student per date)
  const grouped = new Map();

  for (const r of records) {
    const dt = new Date(r.date || r.createdAt);
    const dateFormatted = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
    const studentReg = r.regNumber || 'N/A';
    const groupKey = `${studentReg}_${dateFormatted}`;

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        name: r.studentName || 'N/A',
        regNo: studentReg,
        date: dateFormatted,
        slots: new Set()
      });
    }

    const slotLabel = r.slot || r.lectureTime || r.subject || 'Slot 1';
    grouped.get(groupKey).slots.add(slotLabel);
  }

  let maxSlots = 0;
  grouped.forEach(item => {
    if (item.slots.size > maxSlots) {
      maxSlots = item.slots.size;
    }
  });

  const formattedReport = [];
  grouped.forEach(item => {
    const row = {
      Name: item.name,
      'Reg No': item.regNo,
      Date: item.date
    };

    const slotArray = Array.from(item.slots);
    for (let i = 0; i < Math.max(maxSlots, 1); i++) {
      const colName = `Time Slot ${i + 1}`;
      row[colName] = slotArray[i] || '-';
    }

    formattedReport.push(row);
  });

  return formattedReport;
};

export const batchMarkIdeaLabAttendance = async ({ regNumbers, reason, subject, teacher, room, slots, slot, markedBy }) => {
  if (!Array.isArray(regNumbers) || regNumbers.length === 0) {
    throw new Error('At least one student registration number is required.');
  }

  const slotList = Array.isArray(slots) && slots.length > 0 
    ? slots 
    : [slot || '08:00 - 09:00'];

  const results = [];
  for (const reg of regNumbers) {
    for (const currentSlot of slotList) {
      try {
        const rec = await markIdeaLabAttendance({
          regNumber: reg,
          reason,
          subject: subject || 'Idea Lab Work',
          teacher,
          room,
          slot: currentSlot,
          markedBy
        });
        results.push(rec);
      } catch (e) {
        console.warn(`Failed to mark attendance for ${reg} slot ${currentSlot}:`, e.message);
      }
    }
  }

  return {
    count: results.length,
    records: results
  };
};

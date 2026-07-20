import mongoose from 'mongoose';
import SharedSchedule from '../models/SharedSchedule.js';
import User from '../models/User.js';
import Timetable from '../models/Timetable.js';
import { memoryStore } from './memoryDb.js';

export const shareTimetable = async ({ fromUserId, toRegNumber, timetableData }) => {
  const targetReg = toRegNumber.trim().toUpperCase();

  if (mongoose.connection.readyState === 1) {
    const sender = await User.findById(fromUserId);
    if (!sender) throw new Error('Sender user not found.');

    const recipient = await User.findOne({ registrationNumber: targetReg });
    if (!recipient) {
      throw new Error(`Target student with Reg Number "${targetReg}" not found.`);
    }

    const shareDoc = await SharedSchedule.create({
      fromUserId,
      fromRegNumber: sender.registrationNumber,
      fromStudentName: sender.fullName,
      fromSection: sender.section || 'A',
      toRegNumber: targetReg,
      timetableData: timetableData || {}
    });

    return shareDoc;
  }

  // Memory DB Fallback
  let sender = null;
  for (const reg in memoryStore.users) {
    if (memoryStore.users[reg]._id === fromUserId) {
      sender = memoryStore.users[reg];
      break;
    }
  }

  if (!sender) throw new Error('Sender user not found.');
  if (!memoryStore.users[targetReg]) {
    throw new Error(`Target student with Reg Number "${targetReg}" not found.`);
  }

  const shareDoc = {
    _id: 'share_' + Date.now(),
    fromUserId,
    fromRegNumber: sender.registrationNumber,
    fromStudentName: sender.fullName,
    fromSection: sender.section || 'A',
    toRegNumber: targetReg,
    timetableData: timetableData || {},
    createdAt: new Date().toISOString()
  };

  memoryStore.shared.push(shareDoc);
  return shareDoc;
};

export const getSharedTimetablesForUser = async (regNumber) => {
  const regUpper = regNumber.trim().toUpperCase();

  if (mongoose.connection.readyState === 1) {
    const list = await SharedSchedule.find({ toRegNumber: regUpper }).sort({ createdAt: -1 });
    return list;
  }

  // Memory DB Fallback
  return memoryStore.shared.filter((s) => s.toRegNumber === regUpper);
};

export const importSharedSchedule = async ({ userId, shareId }) => {
  if (mongoose.connection.readyState === 1) {
    const shareDoc = await SharedSchedule.findById(shareId);
    if (!shareDoc) throw new Error('Shared timetable not found.');

    // Flatten timetable data by day keys
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const formatted = {};

    days.forEach((day) => {
      formatted[day] = {};
    });

    if (shareDoc.timetableData) {
      Object.entries(shareDoc.timetableData).forEach(([key, val]) => {
        const [dayName] = key.split('-');
        const lowerDay = dayName.toLowerCase();
        if (days.includes(lowerDay)) {
          formatted[lowerDay][key] = val;
        }
      });
    }

    await Timetable.findOneAndUpdate({ userId }, formatted, { new: true, upsert: true });
    await SharedSchedule.findByIdAndDelete(shareId);

    return { message: `Successfully imported timetable from ${shareDoc.fromStudentName}` };
  }

  // Memory DB Fallback
  const index = memoryStore.shared.findIndex((s) => s._id === shareId);
  if (index === -1) throw new Error('Shared timetable not found.');

  const shareDoc = memoryStore.shared[index];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const formatted = { monday: {}, tuesday: {}, wednesday: {}, thursday: {}, friday: {} };

  if (shareDoc.timetableData) {
    Object.entries(shareDoc.timetableData).forEach(([key, val]) => {
      const [dayName] = key.split('-');
      const lowerDay = dayName.toLowerCase();
      if (days.includes(lowerDay)) {
        formatted[lowerDay][key] = val;
      }
    });
  }

  memoryStore.timetables[userId] = formatted;
  memoryStore.shared.splice(index, 1);

  return { message: `Successfully imported timetable from ${shareDoc.fromStudentName}` };
};

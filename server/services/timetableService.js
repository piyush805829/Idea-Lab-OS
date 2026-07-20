import mongoose from 'mongoose';
import Timetable from '../models/Timetable.js';
import { memoryStore } from './memoryDb.js';

export const getTimetableByUserId = async (userId) => {
  if (mongoose.connection.readyState === 1) {
    let tt = await Timetable.findOne({ userId });
    if (!tt) {
      tt = await Timetable.create({
        userId,
        monday: {},
        tuesday: {},
        wednesday: {},
        thursday: {},
        friday: {}
      });
    }

    // Flatten Map object into standard JSON object
    const result = {
      monday: Object.fromEntries(tt.monday || new Map()),
      tuesday: Object.fromEntries(tt.tuesday || new Map()),
      wednesday: Object.fromEntries(tt.wednesday || new Map()),
      thursday: Object.fromEntries(tt.thursday || new Map()),
      friday: Object.fromEntries(tt.friday || new Map())
    };
    return result;
  }

  // Memory DB Fallback
  if (!memoryStore.timetables[userId]) {
    memoryStore.timetables[userId] = { monday: {}, tuesday: {}, wednesday: {}, thursday: {}, friday: {} };
  }
  return memoryStore.timetables[userId];
};

export const updateTimetable = async (userId, timetableData) => {
  if (mongoose.connection.readyState === 1) {
    const updated = await Timetable.findOneAndUpdate(
      { userId },
      {
        monday: timetableData.monday || {},
        tuesday: timetableData.tuesday || {},
        wednesday: timetableData.wednesday || {},
        thursday: timetableData.thursday || {},
        friday: timetableData.friday || {}
      },
      { new: true, upsert: true }
    );
    return updated;
  }

  // Memory DB Fallback
  memoryStore.timetables[userId] = {
    monday: timetableData.monday || {},
    tuesday: timetableData.tuesday || {},
    wednesday: timetableData.wednesday || {},
    thursday: timetableData.thursday || {},
    friday: timetableData.friday || {}
  };
  return memoryStore.timetables[userId];
};

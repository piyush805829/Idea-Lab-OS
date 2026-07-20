import mongoose from 'mongoose';
import Timetable from '../models/Timetable.js';
import { memoryStore } from './memoryDb.js';

// Helper to parse incoming timetableData into day maps
const parseTimetableData = (data = {}) => {
  const monday = {};
  const tuesday = {};
  const wednesday = {};
  const thursday = {};
  const friday = {};

  // If structured by day keys (e.g. { monday: {...}, tuesday: {...} })
  if (data.monday || data.tuesday || data.wednesday || data.thursday || data.friday) {
    Object.assign(monday, data.monday || {});
    Object.assign(tuesday, data.tuesday || {});
    Object.assign(wednesday, data.wednesday || {});
    Object.assign(thursday, data.thursday || {});
    Object.assign(friday, data.friday || {});
  }

  // Parse flat slot keys (e.g. "Monday-1", "Tuesday-2")
  Object.keys(data).forEach((key) => {
    if (key.includes('-')) {
      const [dayStr] = key.split('-');
      const dLower = dayStr.toLowerCase();
      const val = data[key];

      if (dLower === 'monday') monday[key] = val;
      else if (dLower === 'tuesday') tuesday[key] = val;
      else if (dLower === 'wednesday') wednesday[key] = val;
      else if (dLower === 'thursday') thursday[key] = val;
      else if (dLower === 'friday') friday[key] = val;
    }
  });

  return { monday, tuesday, wednesday, thursday, friday };
};

// Helper to flatten day maps into flat slot keys ("Monday-1", etc.) for frontend
const flattenTimetable = (ttDoc) => {
  if (!ttDoc) return {};
  const result = {};

  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach((day) => {
    const dayObj = ttDoc[day];
    if (dayObj) {
      const entries = dayObj instanceof Map ? Object.fromEntries(dayObj) : dayObj;
      Object.assign(result, entries);
    }
  });

  return result;
};

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

    return flattenTimetable(tt);
  }

  // Memory DB Fallback
  const memTt = memoryStore.timetables[userId] || {};
  return flattenTimetable(memTt);
};

export const updateTimetable = async (userId, timetableData) => {
  const parsed = parseTimetableData(timetableData);

  if (mongoose.connection.readyState === 1) {
    const updated = await Timetable.findOneAndUpdate(
      { userId },
      {
        monday: parsed.monday,
        tuesday: parsed.tuesday,
        wednesday: parsed.wednesday,
        thursday: parsed.thursday,
        friday: parsed.friday
      },
      { new: true, upsert: true }
    );
    return flattenTimetable(updated);
  }

  // Memory DB Fallback
  memoryStore.timetables[userId] = parsed;
  return flattenTimetable(parsed);
};

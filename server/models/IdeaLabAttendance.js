import mongoose from 'mongoose';

const ideaLabAttendanceSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  regNumber: { type: String, required: true, uppercase: true, trim: true },
  department: { type: String, default: '' },
  section: { type: String, default: '' },
  batch: { type: String, default: '' },
  subjectMissed: { type: String, required: true },
  teacher: { type: String, default: '' },
  room: { type: String, default: '' },
  lectureTime: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  attendanceTime: { type: String, default: '' },
  reason: { type: String, default: 'Idea Lab Work' },
  status: { type: String, default: 'Present' }
}, { timestamps: true });

export default mongoose.model('IdeaLabAttendance', ideaLabAttendanceSchema);

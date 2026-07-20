import mongoose from 'mongoose';

const ideaLabAttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    regNumber: {
      type: String,
      required: true,
      uppercase: true,
      index: true
    },
    studentName: {
      type: String,
      required: true
    },
    section: {
      type: String,
      default: 'A'
    },
    branch: {
      type: String,
      default: 'CSE'
    },
    date: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      default: 'Idea Lab Work'
    },
    subject: {
      type: String,
      default: 'N/A'
    },
    teacher: {
      type: String,
      default: 'N/A'
    },
    room: {
      type: String,
      default: 'Idea Lab'
    },
    slot: {
      type: String,
      default: 'Slot 1'
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

const IdeaLabAttendance = mongoose.models.IdeaLabAttendance || mongoose.model('IdeaLabAttendance', ideaLabAttendanceSchema, 'ideaLabAttendance');

export default IdeaLabAttendance;

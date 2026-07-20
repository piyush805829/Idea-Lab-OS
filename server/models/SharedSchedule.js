import mongoose from 'mongoose';

const sharedScheduleSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fromRegNumber: {
      type: String,
      required: true,
      uppercase: true
    },
    fromStudentName: {
      type: String,
      required: true
    },
    fromSection: {
      type: String,
      default: 'A'
    },
    toRegNumber: {
      type: String,
      required: true,
      uppercase: true,
      index: true
    },
    timetableData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

const SharedSchedule = mongoose.models.SharedSchedule || mongoose.model('SharedSchedule', sharedScheduleSchema, 'sharedSchedules');

export default SharedSchedule;

import mongoose from 'mongoose';

const sharedScheduleSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromRegNumber: { type: String, required: true },
  fromStudentName: { type: String, required: true },
  fromSection: { type: String, default: '' },
  toRegNumber: { type: String, required: true, uppercase: true, trim: true },
  timetableData: { type: Object, required: true },
  isImported: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('SharedSchedule', sharedScheduleSchema);

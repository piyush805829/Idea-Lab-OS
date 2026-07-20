import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  timetable: { type: Object, default: {} },
}, { timestamps: true, bufferCommands: false });

export default mongoose.model('Schedule', scheduleSchema);

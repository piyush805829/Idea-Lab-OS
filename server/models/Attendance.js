import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  attendance: { type: Object, default: {} },
}, { timestamps: true });

export default mongoose.model('Attendance', attendanceSchema);

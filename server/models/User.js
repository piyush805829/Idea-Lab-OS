import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  regNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  section: { type: String, default: '' },
  batch: { type: String, default: '' },
  branch: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  lastActive: { type: Date, default: Date.now },
}, { timestamps: true, bufferCommands: false });

export default mongoose.model('User', userSchema);

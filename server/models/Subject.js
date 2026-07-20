import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  teacher: { type: String, default: '' },
  code: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Subject', subjectSchema);

import mongoose from 'mongoose';

const labRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  labs: { type: Object, default: {} },
}, { timestamps: true });

export default mongoose.model('LabRecord', labRecordSchema);

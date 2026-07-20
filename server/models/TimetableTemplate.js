import mongoose from 'mongoose';

const timetableTemplateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  branch: { type: String, default: '' },
  section: { type: String, default: '' },
  timetableData: { type: Object, required: true },
  createdBy: { type: String, default: 'Admin' }
}, { timestamps: true });

export default mongoose.model('TimetableTemplate', timetableTemplateSchema);

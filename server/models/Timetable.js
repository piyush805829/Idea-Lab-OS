import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    monday: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    tuesday: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    wednesday: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    thursday: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    friday: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema, 'timetables');

export default Timetable;

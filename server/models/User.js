import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student'
    },
    branch: {
      type: String,
      default: 'CSE',
      trim: true
    },
    year: {
      type: String,
      default: '1st Year',
      trim: true
    },
    section: {
      type: String,
      default: 'A',
      trim: true
    },
    batch: {
      type: String,
      default: '1',
      trim: true
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

// Prevent re-compilation in hot reloading
const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');

export default User;

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const cleanDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://sainipiyush5924_db_user:Idealab8058@cluster0.3ns5xeq.mongodb.net/idealab_os?retryWrites=true&w=majority';
    console.log('Connecting to MongoDB Atlas to clean student records...');

    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    const userResult = await db.collection('users').deleteMany({ role: { $ne: 'admin' } });
    const timetableResult = await db.collection('timetables').deleteMany({});
    const sharedResult = await db.collection('sharedschedules').deleteMany({});
    const attendanceResult = await db.collection('idealabattendances').deleteMany({});

    console.log('================================');
    console.log(`✓ Registered Students Removed: ${userResult.deletedCount}`);
    console.log(`✓ Student Timetables Cleared: ${timetableResult.deletedCount}`);
    console.log(`✓ Shared Schedules Cleared: ${sharedResult.deletedCount}`);
    console.log(`✓ Idea Lab Attendance Cleared: ${attendanceResult.deletedCount}`);
    console.log('================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
    process.exit(1);
  }
};

cleanDatabase();

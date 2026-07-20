import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI;
    if (!connStr) {
      console.error('❌ MONGODB_URI environment variable is missing.');
      process.exit(1);
    }

    console.log('✓ Connecting to MongoDB...');

    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 10000
    });

    console.log('✓ MongoDB Connected Successfully');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    if (error.message.includes('Authentication failed') || error.message.includes('bad auth')) {
      console.error('⚠️  Authentication Failed: Please check your MongoDB Atlas Database User password in server/.env');
    }
    process.exit(1);
  }
};

export default connectDB;

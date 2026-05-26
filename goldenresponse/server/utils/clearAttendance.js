const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Attendance = require('../models/Attendance');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_db';

async function clearAttendance() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Clearing all attendance records...');
    await Attendance.deleteMany({});
    console.log('Attendance records cleared successfully!');

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing attendance:', error);
    try {
      await mongoose.connection.close();
    } catch (e) {}
    process.exit(1);
  }
}

clearAttendance();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_db';

async function clearAll() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Clearing student, teacher, subject, class, department, and attendance collections...');
    await Promise.all([
      Student.deleteMany({}),
      Teacher.deleteMany({}),
      Subject.deleteMany({}),
      Class.deleteMany({}),
      Department.deleteMany({}),
      Attendance.deleteMany({}),
      User.deleteMany({ role: { $ne: 'admin' } })
    ]);
    console.log('All dynamic records cleared successfully!');

    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      console.log('No admin user found. Creating fallback admin user...');
      await User.create({
        name: 'Admin',
        email: 'admin@college.edu',
        password: 'admin123',
        role: 'admin',
      });
      console.log('Fallback admin created: admin@college.edu / admin123');
    } else {
      console.log('Admin user exists: admin@college.edu / admin123');
    }

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    try {
      await mongoose.connection.close();
    } catch (e) {}
    process.exit(1);
  }
}

clearAll();

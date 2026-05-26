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

async function seedVariousData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear everything
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Teacher.deleteMany({}),
      Subject.deleteMany({}),
      Class.deleteMany({}),
      Department.deleteMany({}),
      Attendance.deleteMany({}),
    ]);

    // Create Departments
    console.log('Creating departments...');
    const depts = await Department.insertMany([
      { name: 'Information Technology', code: 'IT' },
      { name: 'Electrical Engineering', code: 'EE' }
    ]);

    // Create Admin
    console.log('Creating admin...');
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@college.edu',
      password: 'admin123',
      role: 'admin'
    });

    // Create Teachers
    console.log('Creating teachers...');
    const userTeacher1 = await User.create({
      name: 'Dr. Sarah Connor',
      email: 'sarah@college.edu',
      password: 'teacher123',
      role: 'teacher'
    });
    const teacher1 = await Teacher.create({
      userId: userTeacher1._id,
      employeeId: 'IT-TCH-001',
      department: 'Information Technology'
    });

    const userTeacher2 = await User.create({
      name: 'Prof. Charles Xavier',
      email: 'charles@college.edu',
      password: 'teacher123',
      role: 'teacher'
    });
    const teacher2 = await Teacher.create({
      userId: userTeacher2._id,
      employeeId: 'EE-TCH-001',
      department: 'Electrical Engineering'
    });

    // Create Subjects
    console.log('Creating subjects...');
    const sub1 = await Subject.create({
      subjectName: 'Web Programming',
      subjectCode: 'IT401',
      department: 'Information Technology',
      semester: 4,
      teacherId: teacher1._id
    });
    const sub2 = await Subject.create({
      subjectName: 'Artificial Intelligence',
      subjectCode: 'IT402',
      department: 'Information Technology',
      semester: 4,
      teacherId: teacher1._id
    });
    const sub3 = await Subject.create({
      subjectName: 'Circuits & Networks',
      subjectCode: 'EE601',
      department: 'Electrical Engineering',
      semester: 6,
      teacherId: teacher2._id
    });

    await Teacher.findByIdAndUpdate(teacher1._id, { $addToSet: { assignedSubjects: [sub1._id, sub2._id] } });
    await Teacher.findByIdAndUpdate(teacher2._id, { $addToSet: { assignedSubjects: [sub3._id] } });

    // Create Students
    console.log('Creating students...');
    const studentUsers = [];
    const students = [];

    const studentInfo = [
      { name: 'John Connor', email: 'john@student.edu', rollNo: 'IT40101', department: 'Information Technology', semester: 4, section: 'A', batch: '2024-2028' },
      { name: 'Kate Brewster', email: 'kate@student.edu', rollNo: 'IT40102', department: 'Information Technology', semester: 4, section: 'A', batch: '2024-2028' },
      { name: 'Marcus Wright', email: 'marcus@student.edu', rollNo: 'IT40103', department: 'Information Technology', semester: 4, section: 'A', batch: '2024-2028' },
      
      { name: 'Scott Summers', email: 'scott@student.edu', rollNo: 'EE60101', department: 'Electrical Engineering', semester: 6, section: 'B', batch: '2023-2027' },
      { name: 'Jean Grey', email: 'jean@student.edu', rollNo: 'EE60102', department: 'Electrical Engineering', semester: 6, section: 'B', batch: '2023-2027' },
      { name: 'Logan Howlett', email: 'logan@student.edu', rollNo: 'EE60103', department: 'Electrical Engineering', semester: 6, section: 'B', batch: '2023-2027' },
    ];

    for (const info of studentInfo) {
      const user = await User.create({
        name: info.name,
        email: info.email,
        password: 'student123',
        role: 'student'
      });
      studentUsers.push(user);

      const stud = await Student.create({
        userId: user._id,
        rollNo: info.rollNo,
        department: info.department,
        semester: info.semester,
        section: info.section,
        batch: info.batch
      });
      students.push(stud);
    }

    // Create Classes
    console.log('Creating classes...');
    const class1 = await Class.create({
      department: 'Information Technology',
      semester: 4,
      section: 'A',
      batch: '2024-2028',
      subjects: [sub1._id, sub2._id],
      students: [students[0]._id, students[1]._id, students[2]._id]
    });

    const class2 = await Class.create({
      department: 'Electrical Engineering',
      semester: 6,
      section: 'B',
      batch: '2023-2027',
      subjects: [sub3._id],
      students: [students[3]._id, students[4]._id, students[5]._id]
    });

    // Mark attendance logs for IT class (Web Programming) - Day 1: 2 present, 1 absent
    console.log('Creating attendance records...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await Attendance.create({
      classId: class1._id,
      subjectId: sub1._id,
      teacherId: teacher1._id,
      date: yesterday,
      records: [
        { studentId: students[0]._id, status: 'Present' },
        { studentId: students[1]._id, status: 'Present' },
        { studentId: students[2]._id, status: 'Absent' }
      ]
    });

    // IT Class - Day 2 (today): 1 present, 1 absent, 1 late
    await Attendance.create({
      classId: class1._id,
      subjectId: sub1._id,
      teacherId: teacher1._id,
      date: today,
      records: [
        { studentId: students[0]._id, status: 'Present' },
        { studentId: students[1]._id, status: 'Absent' },
        { studentId: students[2]._id, status: 'Late' }
      ]
    });

    // EE Class (Circuits) - Day 1 (today): 3 present
    await Attendance.create({
      classId: class2._id,
      subjectId: sub3._id,
      teacherId: teacher2._id,
      date: today,
      records: [
        { studentId: students[3]._id, status: 'Present' },
        { studentId: students[4]._id, status: 'Present' },
        { studentId: students[5]._id, status: 'Present' }
      ]
    });

    console.log('\n==================================================');
    console.log('VARIOUS TEST DATA SEEDED SUCCESSFULLY!');
    console.log('==================================================');
    console.log('Admin:      admin@college.edu / admin123');
    console.log('IT Teacher: sarah@college.edu / teacher123');
    console.log('EE Teacher: charles@college.edu / teacher123');
    console.log('IT Student: john@student.edu / student123');
    console.log('EE Student: scott@student.edu / student123');
    console.log('==================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding test data:', err);
    try {
      await mongoose.connection.close();
    } catch (e) {}
    process.exit(1);
  }
}

seedVariousData();

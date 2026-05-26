const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from server root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_db';

async function seedData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear all collections
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
    console.log('All collections cleared');

    // ===================== DEPARTMENTS =====================
    console.log('Creating departments...');
    const departments = await Department.insertMany([
      { name: 'Computer Science', code: 'CSE' },
      { name: 'Electronics', code: 'ECE' },
      { name: 'Mechanical', code: 'ME' },
    ]);
    console.log(`Created ${departments.length} departments`);

    // ===================== ADMIN USER =====================
    console.log('Creating admin user...');
    const adminUser = await User.create({
      name: 'Admin',
      email: 'admin@college.edu',
      password: 'admin123',
      role: 'admin',
    });
    console.log('Admin created: admin@college.edu / admin123');

    // ===================== TEACHERS =====================
    console.log('Creating teachers...');
    const teacherData = [
      { name: 'Dr. Rajesh Kumar', email: 'rajesh@college.edu', department: 'Computer Science', employeeId: 'TCH001' },
      { name: 'Prof. Anita Sharma', email: 'anita@college.edu', department: 'Computer Science', employeeId: 'TCH002' },
      { name: 'Dr. Suresh Patel', email: 'suresh@college.edu', department: 'Electronics', employeeId: 'TCH003' },
      { name: 'Prof. Meena Reddy', email: 'meena@college.edu', department: 'Electronics', employeeId: 'TCH004' },
      { name: 'Dr. Vikram Singh', email: 'vikram@college.edu', department: 'Mechanical', employeeId: 'TCH005' },
    ];

    const teacherUsers = [];
    const teachers = [];

    for (const t of teacherData) {
      const user = await User.create({
        name: t.name,
        email: t.email,
        password: 'teacher123',
        role: 'teacher',
      });
      teacherUsers.push(user);

      const teacher = await Teacher.create({
        userId: user._id,
        employeeId: t.employeeId,
        department: t.department,
        assignedSubjects: [],
      });
      teachers.push(teacher);
    }
    console.log(`Created ${teachers.length} teachers`);

    // ===================== SUBJECTS =====================
    console.log('Creating subjects...');
    const subjectData = [
      { subjectName: 'Data Structures', subjectCode: 'CS201', department: 'Computer Science', semester: 3, teacherIdx: 0 },
      { subjectName: 'Algorithms', subjectCode: 'CS301', department: 'Computer Science', semester: 3, teacherIdx: 0 },
      { subjectName: 'Database Management', subjectCode: 'CS302', department: 'Computer Science', semester: 3, teacherIdx: 1 },
      { subjectName: 'Operating Systems', subjectCode: 'CS401', department: 'Computer Science', semester: 5, teacherIdx: 1 },
      { subjectName: 'Computer Networks', subjectCode: 'CS402', department: 'Computer Science', semester: 5, teacherIdx: 0 },
      { subjectName: 'Digital Electronics', subjectCode: 'EC201', department: 'Electronics', semester: 3, teacherIdx: 2 },
      { subjectName: 'Signals & Systems', subjectCode: 'EC301', department: 'Electronics', semester: 3, teacherIdx: 2 },
      { subjectName: 'VLSI Design', subjectCode: 'EC401', department: 'Electronics', semester: 5, teacherIdx: 3 },
      { subjectName: 'Thermodynamics', subjectCode: 'ME201', department: 'Mechanical', semester: 3, teacherIdx: 4 },
      { subjectName: 'Fluid Mechanics', subjectCode: 'ME301', department: 'Mechanical', semester: 5, teacherIdx: 4 },
    ];

    const subjects = [];
    for (const s of subjectData) {
      const subject = await Subject.create({
        subjectName: s.subjectName,
        subjectCode: s.subjectCode,
        department: s.department,
        semester: s.semester,
        teacherId: teachers[s.teacherIdx]._id,
      });
      subjects.push(subject);

      // Assign to teacher
      await Teacher.findByIdAndUpdate(teachers[s.teacherIdx]._id, {
        $addToSet: { assignedSubjects: subject._id },
      });
    }
    console.log(`Created ${subjects.length} subjects`);

    // ===================== STUDENTS =====================
    console.log('Creating students...');
    const studentInfo = [
      // CSE Sem 3 Section A (5 students)
      { name: 'Aarav Patel', email: 'aarav@student.edu', rollNo: 'CSE301', department: 'Computer Science', semester: 3, section: 'A', batch: '2024-2028' },
      { name: 'Priya Singh', email: 'priya@student.edu', rollNo: 'CSE302', department: 'Computer Science', semester: 3, section: 'A', batch: '2024-2028' },
      { name: 'Rohit Sharma', email: 'rohit@student.edu', rollNo: 'CSE303', department: 'Computer Science', semester: 3, section: 'A', batch: '2024-2028' },
      { name: 'Sneha Gupta', email: 'sneha@student.edu', rollNo: 'CSE304', department: 'Computer Science', semester: 3, section: 'A', batch: '2024-2028' },
      { name: 'Arjun Reddy', email: 'arjun@student.edu', rollNo: 'CSE305', department: 'Computer Science', semester: 3, section: 'A', batch: '2024-2028' },
      // CSE Sem 5 Section A (5 students)
      { name: 'Kavya Nair', email: 'kavya@student.edu', rollNo: 'CSE501', department: 'Computer Science', semester: 5, section: 'A', batch: '2023-2027' },
      { name: 'Rahul Verma', email: 'rahul@student.edu', rollNo: 'CSE502', department: 'Computer Science', semester: 5, section: 'A', batch: '2023-2027' },
      { name: 'Deepika Joshi', email: 'deepika@student.edu', rollNo: 'CSE503', department: 'Computer Science', semester: 5, section: 'A', batch: '2023-2027' },
      { name: 'Amit Kumar', email: 'amit@student.edu', rollNo: 'CSE504', department: 'Computer Science', semester: 5, section: 'A', batch: '2023-2027' },
      { name: 'Pooja Mehta', email: 'pooja@student.edu', rollNo: 'CSE505', department: 'Computer Science', semester: 5, section: 'A', batch: '2023-2027' },
      // ECE Sem 3 Section A (5 students)
      { name: 'Ravi Shankar', email: 'ravi@student.edu', rollNo: 'ECE301', department: 'Electronics', semester: 3, section: 'A', batch: '2024-2028' },
      { name: 'Ananya Das', email: 'ananya@student.edu', rollNo: 'ECE302', department: 'Electronics', semester: 3, section: 'A', batch: '2024-2028' },
      { name: 'Vikash Yadav', email: 'vikash@student.edu', rollNo: 'ECE303', department: 'Electronics', semester: 3, section: 'A', batch: '2024-2028' },
      { name: 'Nisha Agarwal', email: 'nisha@student.edu', rollNo: 'ECE304', department: 'Electronics', semester: 3, section: 'A', batch: '2024-2028' },
      { name: 'Siddharth Roy', email: 'siddharth@student.edu', rollNo: 'ECE305', department: 'Electronics', semester: 3, section: 'A', batch: '2024-2028' },
      // ME Sem 3 Section A (5 students)
      { name: 'Manish Tiwari', email: 'manish@student.edu', rollNo: 'ME301', department: 'Mechanical', semester: 3, section: 'A', batch: '2024-2028' },
      { name: 'Swati Mishra', email: 'swati@student.edu', rollNo: 'ME302', department: 'Mechanical', semester: 3, section: 'A', batch: '2024-2028' },
      { name: 'Karan Pandey', email: 'karan@student.edu', rollNo: 'ME303', department: 'Mechanical', semester: 3, section: 'A', batch: '2024-2028' },
      { name: 'Divya Saxena', email: 'divya@student.edu', rollNo: 'ME304', department: 'Mechanical', semester: 3, section: 'A', batch: '2024-2028' },
      { name: 'Nitin Chauhan', email: 'nitin@student.edu', rollNo: 'ME305', department: 'Mechanical', semester: 3, section: 'A', batch: '2024-2028' },
    ];

    const studentUsers = [];
    const students = [];

    for (const s of studentInfo) {
      const user = await User.create({
        name: s.name,
        email: s.email,
        password: 'student123',
        role: 'student',
      });
      studentUsers.push(user);

      const student = await Student.create({
        userId: user._id,
        rollNo: s.rollNo,
        department: s.department,
        semester: s.semester,
        section: s.section,
        batch: s.batch,
      });
      students.push(student);
    }
    console.log(`Created ${students.length} students`);

    // ===================== CLASSES =====================
    console.log('Creating classes...');

    // CSE Sem 3 Section A
    const cseSem3 = await Class.create({
      department: 'Computer Science',
      semester: 3,
      section: 'A',
      batch: '2024-2028',
      subjects: [subjects[0]._id, subjects[1]._id, subjects[2]._id], // DS, Algo, DBMS
      students: students.slice(0, 5).map((s) => s._id),
    });

    // CSE Sem 5 Section A
    const cseSem5 = await Class.create({
      department: 'Computer Science',
      semester: 5,
      section: 'A',
      batch: '2023-2027',
      subjects: [subjects[3]._id, subjects[4]._id], // OS, CN
      students: students.slice(5, 10).map((s) => s._id),
    });

    // ECE Sem 3 Section A
    const eceSem3 = await Class.create({
      department: 'Electronics',
      semester: 3,
      section: 'A',
      batch: '2024-2028',
      subjects: [subjects[5]._id, subjects[6]._id], // DE, SS
      students: students.slice(10, 15).map((s) => s._id),
    });

    // ME Sem 3 Section A
    const meSem3 = await Class.create({
      department: 'Mechanical',
      semester: 3,
      section: 'A',
      batch: '2024-2028',
      subjects: [subjects[8]._id], // Thermo
      students: students.slice(15, 20).map((s) => s._id),
    });

    const classes = [cseSem3, cseSem5, eceSem3, meSem3];
    console.log(`Created ${classes.length} classes`);

    // ===================== ATTENDANCE RECORDS =====================
    console.log('Creating attendance records...');

    const statuses = ['Present', 'Absent', 'Late'];
    let attendanceCount = 0;

    // Generate attendance for the last 30 days (weekdays only)
    const today = new Date();
    const classSubjectPairs = [
      { classDoc: cseSem3, subjectIds: [subjects[0]._id, subjects[1]._id, subjects[2]._id], teacherIdx: [0, 0, 1] },
      { classDoc: cseSem5, subjectIds: [subjects[3]._id, subjects[4]._id], teacherIdx: [1, 0] },
      { classDoc: eceSem3, subjectIds: [subjects[5]._id, subjects[6]._id], teacherIdx: [2, 2] },
      { classDoc: meSem3, subjectIds: [subjects[8]._id], teacherIdx: [4] },
    ];

    for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      date.setHours(0, 0, 0, 0);

      // Skip weekends
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      for (const pair of classSubjectPairs) {
        // Pick one subject per day for each class (rotate)
        const subjectIndex = dayOffset % pair.subjectIds.length;
        const subjectId = pair.subjectIds[subjectIndex];
        const teacherIndex = pair.teacherIdx[subjectIndex];

        const records = pair.classDoc.students.map((studentId) => {
          // Weighted random: 70% present, 15% absent, 15% late
          const rand = Math.random();
          let status;
          if (rand < 0.70) status = 'Present';
          else if (rand < 0.85) status = 'Absent';
          else status = 'Late';

          return {
            studentId,
            status,
            remarks: status === 'Absent' ? 'No reason provided' : '',
          };
        });

        await Attendance.create({
          classId: pair.classDoc._id,
          subjectId,
          teacherId: teachers[teacherIndex]._id,
          date,
          records,
        });
        attendanceCount++;
      }
    }

    console.log(`Created ${attendanceCount} attendance records`);

    // ===================== SUMMARY =====================
    console.log('\n========================================');
    console.log('  SEED DATA CREATED SUCCESSFULLY!');
    console.log('========================================');
    console.log(`  Departments: ${departments.length}`);
    console.log(`  Teachers: ${teachers.length}`);
    console.log(`  Subjects: ${subjects.length}`);
    console.log(`  Classes: ${classes.length}`);
    console.log(`  Students: ${students.length}`);
    console.log(`  Attendance Records: ${attendanceCount}`);
    console.log('========================================');
    console.log('  Login Credentials:');
    console.log('  Admin:   admin@college.edu / admin123');
    console.log('  Teacher: rajesh@college.edu / teacher123');
    console.log('  Student: aarav@student.edu / student123');
    console.log('========================================\n');

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedData();

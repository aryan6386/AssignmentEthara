const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');

// ===================== DASHBOARD =====================

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalClasses, totalSubjects, totalDepartments] =
      await Promise.all([
        Student.countDocuments(),
        Teacher.countDocuments(),
        Class.countDocuments(),
        Subject.countDocuments(),
        Department.countDocuments(),
      ]);

    // Calculate low attendance (students below 75%)
    const allStudents = await Student.find().populate('userId', 'name');
    let lowAttendanceCount = 0;

    for (const student of allStudents) {
      const attendanceRecords = await Attendance.find({ 'records.studentId': student._id });
      let totalClasses2 = 0;
      let presentCount = 0;

      attendanceRecords.forEach((att) => {
        const record = att.records.find(
          (r) => r.studentId.toString() === student._id.toString()
        );
        if (record) {
          totalClasses2++;
          if (record.status === 'Present' || record.status === 'Late') {
            presentCount++;
          }
        }
      });

      if (totalClasses2 > 0 && (presentCount / totalClasses2) * 100 < 75) {
        lowAttendanceCount++;
      }
    }

    // Recent attendance activity (last 5)
    const recentActivity = await Attendance.find()
      .sort({ date: -1 })
      .limit(5)
      .populate('classId', 'department semester section')
      .populate('subjectId', 'subjectName subjectCode')
      .populate({
        path: 'teacherId',
        populate: { path: 'userId', select: 'name' },
      });

    const recentActivityFormatted = recentActivity.map(activity => {
      const presentCount = activity.records.filter(r => r.status === 'Present' || r.status === 'Late').length;
      return {
        _id: activity._id,
        date: activity.date,
        createdAt: activity.createdAt,
        className: activity.classId ? `${activity.classId.department} - Sem ${activity.classId.semester} Sec ${activity.classId.section}` : '-',
        subjectName: activity.subjectId ? `${activity.subjectId.subjectName} (${activity.subjectId.subjectCode})` : '-',
        teacherName: activity.teacherId?.userId?.name || '-',
        presentCount: `${presentCount}/${activity.records.length}`
      };
    });

    // Weekly attendance overview (last 5 weekdays)
    const last5Days = [];
    const today = new Date();
    for (let i = 0; i < 15 && last5Days.length < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const day = d.getDay();
      if (day !== 0 && day !== 6) { // skip weekend
        last5Days.push(d);
      }
    }
    
    // Sort ascending
    last5Days.reverse();

    const chartData = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (const d of last5Days) {
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayRecords = await Attendance.find({
        date: { $gte: d, $lt: nextDay }
      });

      let present = 0;
      let absent = 0;

      dayRecords.forEach(att => {
        att.records.forEach(r => {
          if (r.status === 'Present' || r.status === 'Late') {
            present++;
          } else {
            absent++;
          }
        });
      });

      const total = present + absent;
      chartData.push({
        name: dayNames[d.getDay()],
        present: total > 0 ? Math.round((present / total) * 100) : 0,
        absent: total > 0 ? Math.round((absent / total) * 100) : 0
      });
    }

    res.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      totalDepartments,
      lowAttendanceCount,
      recentActivity: recentActivityFormatted,
      chartData,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
};

// ===================== STUDENTS =====================

// GET /api/admin/students
exports.getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      query = {
        $or: [
          { rollNo: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } },
          { section: { $regex: search, $options: 'i' } },
          { batch: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('userId', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Student.countDocuments(query),
    ]);

    res.json({
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error fetching students' });
  }
};

// GET /api/admin/students/:id
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId', 'name email');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ student });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error fetching student' });
  }
};

// POST /api/admin/students
exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, rollNo, department, semester, section, batch } = req.body;

    // Check if user email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create user account
    const user = await User.create({
      name,
      email,
      password: password || 'student123',
      role: 'student',
    });

    // Create student profile
    const student = await Student.create({
      userId: user._id,
      rollNo,
      department,
      semester,
      section,
      batch,
    });

    // Add student to matching class
    await Class.updateMany(
      { department, semester, section, batch },
      { $addToSet: { students: student._id } }
    );

    const populatedStudent = await Student.findById(student._id).populate('userId', 'name email');

    res.status(201).json({ message: 'Student created successfully', student: populatedStudent });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Server error creating student' });
  }
};

// PUT /api/admin/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const { name, email, rollNo, department, semester, section, batch } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update user info if provided
    if (name || email) {
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      await User.findByIdAndUpdate(student.userId, updateData);
    }

    // Update student info
    if (rollNo) student.rollNo = rollNo;
    if (department) student.department = department;
    if (semester) student.semester = semester;
    if (section) student.section = section;
    if (batch) student.batch = batch;

    await student.save();

    const updatedStudent = await Student.findById(student._id).populate('userId', 'name email');

    res.json({ message: 'Student updated successfully', student: updatedStudent });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Server error updating student' });
  }
};

// DELETE /api/admin/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Remove from classes
    await Class.updateMany({}, { $pull: { students: student._id } });

    // Delete user account
    await User.findByIdAndDelete(student.userId);

    // Delete student
    await Student.findByIdAndDelete(req.params.id);

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error deleting student' });
  }
};

// ===================== TEACHERS =====================

// GET /api/admin/teachers
exports.getTeachers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      query = {
        $or: [
          { employeeId: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const [teachers, total] = await Promise.all([
      Teacher.find(query)
        .populate('userId', 'name email')
        .populate('assignedSubjects', 'subjectName subjectCode')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Teacher.countDocuments(query),
    ]);

    res.json({
      teachers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: 'Server error fetching teachers' });
  }
};

// GET /api/admin/teachers/:id
exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('assignedSubjects', 'subjectName subjectCode department semester');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ teacher });
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({ message: 'Server error fetching teacher' });
  }
};

// POST /api/admin/teachers
exports.createTeacher = async (req, res) => {
  try {
    const { name, email, password, employeeId, department, assignedSubjects } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const user = await User.create({
      name,
      email,
      password: password || 'teacher123',
      role: 'teacher',
    });

    const teacher = await Teacher.create({
      userId: user._id,
      employeeId,
      department,
      assignedSubjects: assignedSubjects || [],
    });

    // Update subjects with teacherId
    if (assignedSubjects && assignedSubjects.length > 0) {
      await Subject.updateMany(
        { _id: { $in: assignedSubjects } },
        { teacherId: teacher._id }
      );
    }

    const populatedTeacher = await Teacher.findById(teacher._id)
      .populate('userId', 'name email')
      .populate('assignedSubjects', 'subjectName subjectCode');

    res.status(201).json({ message: 'Teacher created successfully', teacher: populatedTeacher });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ message: 'Server error creating teacher' });
  }
};

// PUT /api/admin/teachers/:id
exports.updateTeacher = async (req, res) => {
  try {
    const { name, email, employeeId, department, assignedSubjects } = req.body;

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (name || email) {
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      await User.findByIdAndUpdate(teacher.userId, updateData);
    }

    if (employeeId) teacher.employeeId = employeeId;
    if (department) teacher.department = department;
    if (assignedSubjects) teacher.assignedSubjects = assignedSubjects;

    await teacher.save();

    const updatedTeacher = await Teacher.findById(teacher._id)
      .populate('userId', 'name email')
      .populate('assignedSubjects', 'subjectName subjectCode');

    res.json({ message: 'Teacher updated successfully', teacher: updatedTeacher });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ message: 'Server error updating teacher' });
  }
};

// DELETE /api/admin/teachers/:id
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Remove teacherId from subjects
    await Subject.updateMany({ teacherId: teacher._id }, { $unset: { teacherId: '' } });

    await User.findByIdAndDelete(teacher.userId);
    await Teacher.findByIdAndDelete(req.params.id);

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ message: 'Server error deleting teacher' });
  }
};

// ===================== SUBJECTS =====================

// GET /api/admin/subjects
exports.getSubjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      query = {
        $or: [
          { subjectName: { $regex: search, $options: 'i' } },
          { subjectCode: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const [subjects, total] = await Promise.all([
      Subject.find(query)
        .populate({
          path: 'teacherId',
          populate: { path: 'userId', select: 'name' },
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Subject.countDocuments(query),
    ]);

    res.json({
      subjects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ message: 'Server error fetching subjects' });
  }
};

// POST /api/admin/subjects
exports.createSubject = async (req, res) => {
  try {
    const { subjectName, subjectCode, department, semester, teacherId } = req.body;

    const existing = await Subject.findOne({ subjectCode: subjectCode.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Subject code already exists' });
    }

    const subject = await Subject.create({
      subjectName,
      subjectCode,
      department,
      semester,
      teacherId,
    });

    // Add to teacher's assigned subjects
    if (teacherId) {
      await Teacher.findByIdAndUpdate(teacherId, {
        $addToSet: { assignedSubjects: subject._id },
      });
    }

    res.status(201).json({ message: 'Subject created successfully', subject });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ message: 'Server error creating subject' });
  }
};

// PUT /api/admin/subjects/:id
exports.updateSubject = async (req, res) => {
  try {
    const { subjectName, subjectCode, department, semester, teacherId } = req.body;

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (subjectName) subject.subjectName = subjectName;
    if (subjectCode) subject.subjectCode = subjectCode;
    if (department) subject.department = department;
    if (semester) subject.semester = semester;
    if (teacherId !== undefined) subject.teacherId = teacherId;

    await subject.save();

    res.json({ message: 'Subject updated successfully', subject });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ message: 'Server error updating subject' });
  }
};

// DELETE /api/admin/subjects/:id
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Remove from classes and teachers
    await Class.updateMany({}, { $pull: { subjects: subject._id } });
    await Teacher.updateMany({}, { $pull: { assignedSubjects: subject._id } });

    await Subject.findByIdAndDelete(req.params.id);

    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: 'Server error deleting subject' });
  }
};

// ===================== CLASSES =====================

// GET /api/admin/classes
exports.getClasses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      query = {
        $or: [
          { department: { $regex: search, $options: 'i' } },
          { section: { $regex: search, $options: 'i' } },
          { batch: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const [classes, total] = await Promise.all([
      Class.find(query)
        .populate('subjects', 'subjectName subjectCode')
        .populate({
          path: 'students',
          populate: { path: 'userId', select: 'name' },
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Class.countDocuments(query),
    ]);

    res.json({
      classes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error fetching classes' });
  }
};

// POST /api/admin/classes
exports.createClass = async (req, res) => {
  try {
    const { department, semester, section, batch, subjects, students } = req.body;

    const classDoc = await Class.create({
      department,
      semester,
      section,
      batch,
      subjects: subjects || [],
      students: students || [],
    });

    res.status(201).json({ message: 'Class created successfully', class: classDoc });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ message: 'Server error creating class' });
  }
};

// PUT /api/admin/classes/:id
exports.updateClass = async (req, res) => {
  try {
    const { department, semester, section, batch, subjects, students } = req.body;

    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (department) classDoc.department = department;
    if (semester) classDoc.semester = semester;
    if (section) classDoc.section = section;
    if (batch) classDoc.batch = batch;
    if (subjects) classDoc.subjects = subjects;
    if (students) classDoc.students = students;

    await classDoc.save();

    res.json({ message: 'Class updated successfully', class: classDoc });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ message: 'Server error updating class' });
  }
};

// DELETE /api/admin/classes/:id
exports.deleteClass = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    await Class.findByIdAndDelete(req.params.id);

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ message: 'Server error deleting class' });
  }
};

// ===================== DEPARTMENTS =====================

// GET /api/admin/departments
exports.getDepartments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const [departments, total] = await Promise.all([
      Department.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Department.countDocuments(query),
    ]);

    res.json({
      departments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Server error fetching departments' });
  }
};

// POST /api/admin/departments
exports.createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;

    const existing = await Department.findOne({
      $or: [{ name }, { code: code.toUpperCase() }],
    });
    if (existing) {
      return res.status(400).json({ message: 'Department name or code already exists' });
    }

    const department = await Department.create({ name, code });

    res.status(201).json({ message: 'Department created successfully', department });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ message: 'Server error creating department' });
  }
};

// PUT /api/admin/departments/:id
exports.updateDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    if (name) department.name = name;
    if (code) department.code = code;

    await department.save();

    res.json({ message: 'Department updated successfully', department });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ message: 'Server error updating department' });
  }
};

// DELETE /api/admin/departments/:id
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    await Department.findByIdAndDelete(req.params.id);

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ message: 'Server error deleting department' });
  }
};

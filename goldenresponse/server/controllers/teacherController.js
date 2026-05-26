const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');

// GET /api/teacher/profile
exports.getProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id })
      .populate('userId', 'name email')
      .populate('assignedSubjects', 'subjectName subjectCode department semester');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Get classes that have the teacher's subjects
    const classes = await Class.find({
      subjects: { $in: teacher.assignedSubjects.map((s) => s._id) },
    }).populate('subjects', 'subjectName subjectCode');

    res.json({ teacher, classes });
  } catch (error) {
    console.error('Get teacher profile error:', error);
    res.status(500).json({ message: 'Server error fetching teacher profile' });
  }
};

// GET /api/teacher/classes
exports.getClasses = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    const classes = await Class.find({
      subjects: { $in: teacher.assignedSubjects },
    })
      .populate('subjects', 'subjectName subjectCode')
      .populate({
        path: 'students',
        populate: { path: 'userId', select: 'name' },
      });

    res.json({ classes });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({ message: 'Server error fetching classes' });
  }
};

// GET /api/teacher/subjects
exports.getSubjects = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id }).populate(
      'assignedSubjects',
      'subjectName subjectCode department semester'
    );

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    res.json({ subjects: teacher.assignedSubjects });
  } catch (error) {
    console.error('Get teacher subjects error:', error);
    res.status(500).json({ message: 'Server error fetching subjects' });
  }
};

// GET /api/teacher/low-attendance/:classId/:subjectId
exports.getLowAttendance = async (req, res) => {
  try {
    const { classId, subjectId } = req.params;

    const classDoc = await Class.findById(classId).populate({
      path: 'students',
      populate: { path: 'userId', select: 'name email' },
    });

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const attendanceRecords = await Attendance.find({ classId, subjectId });
    const totalSessions = attendanceRecords.length;

    if (totalSessions === 0) {
      return res.json({ lowAttendanceStudents: [], totalSessions: 0 });
    }

    const lowAttendanceStudents = [];

    for (const student of classDoc.students) {
      let presentCount = 0;

      attendanceRecords.forEach((att) => {
        const record = att.records.find(
          (r) => r.studentId.toString() === student._id.toString()
        );
        if (record && (record.status === 'Present' || record.status === 'Late')) {
          presentCount++;
        }
      });

      const percentage = (presentCount / totalSessions) * 100;

      if (percentage < 75) {
        lowAttendanceStudents.push({
          student: {
            _id: student._id,
            rollNo: student.rollNo,
            name: student.userId?.name,
            email: student.userId?.email,
          },
          totalSessions,
          present: presentCount,
          absent: totalSessions - presentCount,
          percentage: Math.round(percentage * 100) / 100,
        });
      }
    }

    lowAttendanceStudents.sort((a, b) => a.percentage - b.percentage);

    res.json({ lowAttendanceStudents, totalSessions });
  } catch (error) {
    console.error('Get low attendance error:', error);
    res.status(500).json({ message: 'Server error fetching low attendance data' });
  }
};

// GET /api/teacher/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id })
      .populate('userId', 'name email')
      .populate('assignedSubjects', 'subjectName subjectCode');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    const classes = await Class.find({
      subjects: { $in: teacher.assignedSubjects.map((s) => s._id) },
    });

    const totalStudents = new Set();
    classes.forEach((c) => c.students.forEach((s) => totalStudents.add(s.toString())));

    // Recent attendance marked by this teacher
    const recentAttendance = await Attendance.find({ teacherId: teacher._id })
      .sort({ date: -1 })
      .limit(10)
      .populate('classId', 'department semester section')
      .populate('subjectId', 'subjectName subjectCode');

    // Today's attendance count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.countDocuments({
      teacherId: teacher._id,
      date: { $gte: today, $lt: tomorrow },
    });

    // Total Sessions marked by this teacher
    const totalSessions = await Attendance.countDocuments({ teacherId: teacher._id });

    // Class-wise Attendance
    const classWiseAttendance = [];
    for (const cls of classes) {
      const records = await Attendance.find({ classId: cls._id, teacherId: teacher._id });
      let present = 0;
      let absent = 0;
      records.forEach(att => {
        att.records.forEach(r => {
          if (r.status === 'Present' || r.status === 'Late') {
            present++;
          } else {
            absent++;
          }
        });
      });
      const total = present + absent;
      classWiseAttendance.push({
        name: `${cls.department} - Sem ${cls.semester} Sec ${cls.section}`,
        present: total > 0 ? Math.round((present / total) * 100) : 0,
        absent: total > 0 ? Math.round((absent / total) * 100) : 0
      });
    }

    // Low Attendance Students (below 75%)
    const lowAttendanceStudents = [];
    const classesWithStudents = await Class.find({
      _id: { $in: classes.map(c => c._id) }
    }).populate({
      path: 'students',
      populate: { path: 'userId', select: 'name' }
    });

    for (const cls of classesWithStudents) {
      for (const student of cls.students) {
        const studentAttendance = await Attendance.find({
          classId: cls._id,
          teacherId: teacher._id,
          'records.studentId': student._id
        });

        let totalSessionsForStudent = 0;
        let presentCount = 0;

        studentAttendance.forEach(att => {
          const record = att.records.find(r => r.studentId.toString() === student._id.toString());
          if (record) {
            totalSessionsForStudent++;
            if (record.status === 'Present' || record.status === 'Late') {
              presentCount++;
            }
          }
        });

        if (totalSessionsForStudent > 0) {
          const percentage = (presentCount / totalSessionsForStudent) * 100;
          if (percentage < 75) {
            lowAttendanceStudents.push({
              studentId: student._id,
              name: student.userId?.name || 'Unknown Student',
              studentName: student.userId?.name || 'Unknown Student',
              subject: `${cls.department} - Sem ${cls.semester} Sec ${cls.section}`,
              className: `${cls.department} - Sem ${cls.semester} Sec ${cls.section}`,
              percentage: Math.round(percentage * 10) / 10,
              attendancePercentage: Math.round(percentage * 10) / 10
            });
          }
        }
      }
    }

    const lowAttendanceCount = lowAttendanceStudents.length;

    res.json({
      teacher,
      totalSubjects: teacher.assignedSubjects.length,
      totalClasses: classes.length,
      totalStudents: totalStudents.size,
      todayAttendance,
      recentAttendance,
      totalSessions,
      lowAttendanceCount,
      lowAttendanceStudents,
      classWiseAttendance,
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching teacher dashboard' });
  }
};

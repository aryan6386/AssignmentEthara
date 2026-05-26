const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const Class = require('../models/Class');

// GET /api/student/profile
exports.getProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email'
    );

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Get the student's class
    const studentClass = await Class.findOne({ students: student._id })
      .populate('subjects', 'subjectName subjectCode')
      .populate({
        path: 'subjects',
        populate: {
          path: 'teacherId',
          populate: { path: 'userId', select: 'name' },
        },
      });

    res.json({ student, class: studentClass });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ message: 'Server error fetching student profile' });
  }
};

// GET /api/student/attendance
exports.getAttendance = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { 'records.studentId': student._id };

    if (req.query.subjectId) {
      filter.subjectId = req.query.subjectId;
    }
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    const [attendanceRecords, total] = await Promise.all([
      Attendance.find(filter)
        .populate('subjectId', 'subjectName subjectCode')
        .populate('classId', 'department semester section')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(filter),
    ]);

    // Extract student-specific records
    const records = attendanceRecords.map((att) => {
      const studentRecord = att.records.find(
        (r) => r.studentId.toString() === student._id.toString()
      );
      return {
        _id: att._id,
        date: att.date,
        subject: att.subjectId,
        class: att.classId,
        status: studentRecord?.status,
        remarks: studentRecord?.remarks,
      };
    });

    res.json({
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
};

// GET /api/student/attendance/summary
exports.getAttendanceSummary = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const allAttendance = await Attendance.find({
      'records.studentId': student._id,
    }).populate('subjectId', 'subjectName subjectCode');

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalClasses = 0;

    // Subject-wise breakdown
    const subjectMap = {};
    // Monthly breakdown
    const monthlyMap = {};

    allAttendance.forEach((att) => {
      const record = att.records.find(
        (r) => r.studentId.toString() === student._id.toString()
      );
      if (!record) return;

      totalClasses++;

      if (record.status === 'Present') totalPresent++;
      else if (record.status === 'Absent') totalAbsent++;
      else if (record.status === 'Late') totalLate++;

      // Subject-wise
      const subId = att.subjectId?._id?.toString();
      if (subId) {
        if (!subjectMap[subId]) {
          subjectMap[subId] = {
            subject: att.subjectId,
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
          };
        }
        subjectMap[subId].total++;
        if (record.status === 'Present') subjectMap[subId].present++;
        else if (record.status === 'Absent') subjectMap[subId].absent++;
        else if (record.status === 'Late') subjectMap[subId].late++;
      }

      // Monthly
      const monthKey = `${att.date.getFullYear()}-${String(att.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, total: 0, present: 0, absent: 0, late: 0 };
      }
      monthlyMap[monthKey].total++;
      if (record.status === 'Present') monthlyMap[monthKey].present++;
      else if (record.status === 'Absent') monthlyMap[monthKey].absent++;
      else if (record.status === 'Late') monthlyMap[monthKey].late++;
    });

    // Calculate percentages
    const overallPercentage = totalClasses > 0
      ? Math.round(((totalPresent + totalLate) / totalClasses) * 10000) / 100
      : 0;

    const subjectWise = Object.values(subjectMap).map((s) => ({
      ...s,
      percentage: s.total > 0
        ? Math.round(((s.present + s.late) / s.total) * 10000) / 100
        : 0,
    }));

    const monthlyData = Object.values(monthlyMap).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    res.json({
      overallPercentage,
      totalClasses,
      totalPresent,
      totalAbsent,
      totalLate,
      subjectWise,
      monthlyData,
    });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ message: 'Server error fetching attendance summary' });
  }
};

// GET /api/student/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email'
    );

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const studentClass = await Class.findOne({ students: student._id })
      .populate('subjects', 'subjectName subjectCode');

    // Attendance summary
    const allAttendance = await Attendance.find({
      'records.studentId': student._id,
    }).populate('subjectId', 'subjectName subjectCode');

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalSessions = 0;

    // Subject-wise breakdown
    const subjectMap = {};
    // Monthly breakdown
    const monthlyMap = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    allAttendance.forEach((att) => {
      const record = att.records.find(
        (r) => r.studentId.toString() === student._id.toString()
      );
      if (!record) return;
      totalSessions++;
      if (record.status === 'Present') totalPresent++;
      else if (record.status === 'Absent') totalAbsent++;
      else if (record.status === 'Late') totalLate++;

      const subId = att.subjectId?._id?.toString();
      if (subId) {
        if (!subjectMap[subId]) {
          subjectMap[subId] = {
            subjectName: att.subjectId.subjectName,
            subjectCode: att.subjectId.subjectCode,
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
          };
        }
        subjectMap[subId].total++;
        if (record.status === 'Present') subjectMap[subId].present++;
        else if (record.status === 'Absent') subjectMap[subId].absent++;
        else if (record.status === 'Late') subjectMap[subId].late++;
      }

      const monthIndex = att.date.getMonth();
      const year = att.date.getFullYear();
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          name: `${monthNames[monthIndex]} ${year % 100}`,
          monthKey,
          total: 0,
          present: 0,
          absent: 0,
          late: 0
        };
      }
      monthlyMap[monthKey].total++;
      if (record.status === 'Present' || record.status === 'Late') {
        monthlyMap[monthKey].present++;
      } else {
        monthlyMap[monthKey].absent++;
      }
    });

    const overallPercentage = totalSessions > 0
      ? Math.round(((totalPresent + totalLate) / totalSessions) * 10000) / 100
      : 0;

    const subjectWise = Object.values(subjectMap).map((s) => ({
      ...s,
      percentage: s.total > 0
        ? Math.round(((s.present + s.late) / s.total) * 10000) / 100
        : 0,
    }));

    const monthlyData = Object.values(monthlyMap)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map(m => ({
        name: m.name,
        percentage: m.total > 0 ? Math.round((m.present / m.total) * 100) : 0
      }));

    // Recent attendance (last 5)
    const recentAttendance = await Attendance.find({
      'records.studentId': student._id,
    })
      .sort({ date: -1 })
      .limit(5)
      .populate('subjectId', 'subjectName subjectCode');

    const recent = recentAttendance.map((att) => {
      const record = att.records.find(
        (r) => r.studentId.toString() === student._id.toString()
      );
      return {
        date: att.date,
        subject: att.subjectId,
        status: record?.status,
      };
    });

    res.json({
      student,
      class: studentClass,
      totalSubjects: studentClass?.subjects?.length || 0,
      overallPercentage,
      totalSessions,
      totalPresent,
      totalAbsent,
      totalLate,
      recentAttendance: recent,
      subjectWise,
      monthlyAttendance: monthlyData,
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching student dashboard' });
  }
};

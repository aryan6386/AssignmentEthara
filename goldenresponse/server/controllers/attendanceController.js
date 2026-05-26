const Attendance = require('../models/Attendance');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');

// POST /api/attendance/mark
exports.markAttendance = async (req, res) => {
  try {
    const { classId, subjectId, date, records } = req.body;

    if (!classId || !subjectId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({
        message: 'classId, subjectId, date, and records array are required',
      });
    }

    // Get teacher profile
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    // Check if attendance already exists for this class, subject, and date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existing = await Attendance.findOne({
      classId,
      subjectId,
      date: { $gte: attendanceDate, $lt: nextDay },
    });

    if (existing) {
      return res.status(400).json({
        message: 'Attendance already marked for this class, subject, and date. Use PUT to update.',
      });
    }

    const attendance = await Attendance.create({
      classId,
      subjectId,
      teacherId: teacher._id,
      date: attendanceDate,
      records,
    });

    const populated = await Attendance.findById(attendance._id)
      .populate('classId', 'department semester section')
      .populate('subjectId', 'subjectName subjectCode')
      .populate({
        path: 'records.studentId',
        populate: { path: 'userId', select: 'name' },
      });

    res.status(201).json({ message: 'Attendance marked successfully', attendance: populated });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Server error marking attendance' });
  }
};

// PUT /api/attendance/:id
exports.editAttendance = async (req, res) => {
  try {
    const { records, studentId, status } = req.body;

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Verify the teacher owns this record
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher || attendance.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this attendance record' });
    }

    if (records && Array.isArray(records)) {
      attendance.records = records;
    } else if (studentId && status) {
      const recordIndex = attendance.records.findIndex(
        (r) => r.studentId.toString() === studentId.toString()
      );
      if (recordIndex !== -1) {
        const capitalizedStatus = status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : status === 'late' ? 'Late' : status;
        attendance.records[recordIndex].status = capitalizedStatus;
      } else {
        return res.status(404).json({ message: 'Student record not found in this attendance session' });
      }
    }

    await attendance.save();

    const populated = await Attendance.findById(attendance._id)
      .populate('classId', 'department semester section')
      .populate('subjectId', 'subjectName subjectCode')
      .populate({
        path: 'records.studentId',
        populate: { path: 'userId', select: 'name' },
      });

    res.json({ message: 'Attendance updated successfully', attendance: populated });
  } catch (error) {
    console.error('Edit attendance error:', error);
    res.status(500).json({ message: 'Server error editing attendance' });
  }
};

// GET /api/attendance/class/:classId/subject/:subjectId
exports.getByClassAndSubject = async (req, res) => {
  try {
    const { classId, subjectId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { classId, subjectId };

    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    } else if (req.query.date) {
      const date = new Date(req.query.date);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: date, $lt: nextDay };
    }

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate('subjectId', 'subjectName subjectCode')
        .populate('classId', 'department semester section')
        .populate({
          path: 'teacherId',
          populate: { path: 'userId', select: 'name' },
        })
        .populate({
          path: 'records.studentId',
          populate: { path: 'userId', select: 'name' },
        })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(filter),
    ]);

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
    console.error('Get attendance by class/subject error:', error);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
};

// GET /api/attendance/history
exports.getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.classId) filter.classId = req.query.classId;
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;
    if (req.query.teacherId) filter.teacherId = req.query.teacherId;

    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    // If user is a teacher, only show their records
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: req.user._id });
      if (teacher) {
        filter.teacherId = teacher._id;
      }
    }

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate('subjectId', 'subjectName subjectCode')
        .populate('classId', 'department semester section batch')
        .populate({
          path: 'teacherId',
          populate: { path: 'userId', select: 'name' },
        })
        .populate({
          path: 'records.studentId',
          populate: { path: 'userId', select: 'name' },
        })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(filter),
    ]);

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
    console.error('Get attendance history error:', error);
    res.status(500).json({ message: 'Server error fetching attendance history' });
  }
};

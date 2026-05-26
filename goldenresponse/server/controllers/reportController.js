const path = require('path');
const fs = require('fs');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');

// GET /api/reports/student/:studentId
exports.getStudentReport = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId).populate(
      'userId',
      'name email'
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const allAttendance = await Attendance.find({
      'records.studentId': student._id,
    }).populate('subjectId', 'subjectName subjectCode');

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalSessions = 0;
    const subjectMap = {};

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
    });

    const overallPercentage =
      totalSessions > 0
        ? Math.round(((totalPresent + totalLate) / totalSessions) * 10000) / 100
        : 0;

    const subjectWise = Object.values(subjectMap).map((s) => ({
      ...s,
      percentage:
        s.total > 0
          ? Math.round(((s.present + s.late) / s.total) * 10000) / 100
          : 0,
    }));

    res.json({
      student: {
        _id: student._id,
        name: student.userId?.name,
        email: student.userId?.email,
        rollNo: student.rollNo,
        department: student.department,
        semester: student.semester,
        section: student.section,
        batch: student.batch,
      },
      overallPercentage,
      totalSessions,
      totalPresent,
      totalAbsent,
      totalLate,
      subjectWise,
    });
  } catch (error) {
    console.error('Student report error:', error);
    res.status(500).json({ message: 'Server error generating student report' });
  }
};

// GET /api/reports/class/:classId
exports.getClassReport = async (req, res) => {
  try {
    if (req.params.classId === 'all') {
      const classes = await Class.find()
        .populate('subjects', 'subjectName subjectCode');
      
      const classReports = [];
      for (const cls of classes) {
        const attendanceRecords = await Attendance.find({ classId: cls._id });
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;
        let totalRecords = 0;

        attendanceRecords.forEach(att => {
          att.records.forEach(r => {
            totalRecords++;
            if (r.status === 'Present') totalPresent++;
            else if (r.status === 'Absent') totalAbsent++;
            else if (r.status === 'Late') totalLate++;
          });
        });

        const totalPresentOrLate = totalPresent + totalLate;
        const percentage = totalRecords > 0 ? Math.round((totalPresentOrLate / totalRecords) * 10000) / 100 : 0;

        classReports.push({
          className: `${cls.department} - Sem ${cls.semester} Sec ${cls.section}`,
          name: `${cls.department} - Sem ${cls.semester} Sec ${cls.section}`,
          total: totalRecords,
          present: totalPresentOrLate,
          absent: totalAbsent,
          percentage
        });
      }

      return res.json({
        classes: classReports,
        totalSessions: classReports.reduce((acc, c) => acc + c.total, 0),
        data: classReports
      });
    }

    const classDoc = await Class.findById(req.params.classId)
      .populate({
        path: 'students',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('subjects', 'subjectName subjectCode');

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const attendanceRecords = await Attendance.find({ classId: classDoc._id }).populate(
      'subjectId',
      'subjectName subjectCode'
    );

    const studentReports = classDoc.students.map((student) => {
      let total = 0;
      let present = 0;
      let absent = 0;
      let late = 0;

      attendanceRecords.forEach((att) => {
        const record = att.records.find(
          (r) => r.studentId.toString() === student._id.toString()
        );
        if (record) {
          total++;
          if (record.status === 'Present') present++;
          else if (record.status === 'Absent') absent++;
          else if (record.status === 'Late') late++;
        }
      });

      return {
        student: {
          _id: student._id,
          name: student.userId?.name,
          rollNo: student.rollNo,
        },
        total,
        present,
        absent,
        late,
        percentage:
          total > 0
            ? Math.round(((present + late) / total) * 10000) / 100
            : 0,
      };
    });

    studentReports.sort((a, b) => a.student.rollNo.localeCompare(b.student.rollNo));

    const formattedData = studentReports.map(sr => ({
      name: sr.student.name || 'Unknown Student',
      present: sr.present + sr.late,
      absent: sr.absent,
      percentage: sr.percentage
    }));

    res.json({
      class: {
        _id: classDoc._id,
        department: classDoc.department,
        semester: classDoc.semester,
        section: classDoc.section,
        batch: classDoc.batch,
      },
      totalSessions: attendanceRecords.length,
      totalStudents: classDoc.students.length,
      studentReports,
      data: formattedData
    });
  } catch (error) {
    console.error('Class report error:', error);
    res.status(500).json({ message: 'Server error generating class report' });
  }
};

// GET /api/reports/subject/:subjectId
exports.getSubjectReport = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const attendanceRecords = await Attendance.find({ subjectId: subject._id })
      .populate('classId', 'department semester section batch')
      .populate({
        path: 'records.studentId',
        populate: { path: 'userId', select: 'name' },
      });

    const totalSessions = attendanceRecords.length;
    const studentMap = {};

    attendanceRecords.forEach((att) => {
      att.records.forEach((record) => {
        const sId = record.studentId?._id?.toString();
        if (!sId) return;

        if (!studentMap[sId]) {
          studentMap[sId] = {
            student: {
              _id: record.studentId._id,
              name: record.studentId.userId?.name,
              rollNo: record.studentId.rollNo,
            },
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
          };
        }
        studentMap[sId].total++;
        if (record.status === 'Present') studentMap[sId].present++;
        else if (record.status === 'Absent') studentMap[sId].absent++;
        else if (record.status === 'Late') studentMap[sId].late++;
      });
    });

    const studentReports = Object.values(studentMap).map((s) => ({
      ...s,
      percentage:
        s.total > 0
          ? Math.round(((s.present + s.late) / s.total) * 10000) / 100
          : 0,
    }));

    const formattedData = studentReports.map(sr => ({
      name: sr.student.name || 'Unknown Student',
      present: sr.present + sr.late,
      absent: sr.absent,
      percentage: sr.percentage
    }));

    res.json({
      subject: {
        _id: subject._id,
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        department: subject.department,
        semester: subject.semester,
      },
      totalSessions,
      studentReports,
      data: formattedData
    });
  } catch (error) {
    console.error('Subject report error:', error);
    res.status(500).json({ message: 'Server error generating subject report' });
  }
};

// GET /api/reports/low-attendance
exports.getLowAttendance = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 75;

    const allStudents = await Student.find().populate('userId', 'name email');
    const lowAttendanceStudents = [];

    for (const student of allStudents) {
      const attendanceRecords = await Attendance.find({
        'records.studentId': student._id,
      });

      let total = 0;
      let present = 0;

      attendanceRecords.forEach((att) => {
        const record = att.records.find(
          (r) => r.studentId.toString() === student._id.toString()
        );
        if (record) {
          total++;
          if (record.status === 'Present' || record.status === 'Late') {
            present++;
          }
        }
      });

      if (total > 0) {
        const percentage = Math.round((present / total) * 10000) / 100;
        if (percentage < threshold) {
          lowAttendanceStudents.push({
            student: {
              _id: student._id,
              name: student.userId?.name,
              email: student.userId?.email,
              rollNo: student.rollNo,
              department: student.department,
              semester: student.semester,
              section: student.section,
            },
            totalSessions: total,
            present,
            absent: total - present,
            percentage,
          });
        }
      }
    }

    lowAttendanceStudents.sort((a, b) => a.percentage - b.percentage);

    res.json({
      threshold,
      count: lowAttendanceStudents.length,
      students: lowAttendanceStudents,
    });
  } catch (error) {
    console.error('Low attendance report error:', error);
    res.status(500).json({ message: 'Server error generating low attendance report' });
  }
};

// GET /api/reports/download/csv
exports.downloadCSV = async (req, res) => {
  try {
    const { classId, subjectId, startDate, endDate } = req.query;

    const filter = {};
    if (classId) filter.classId = classId;
    if (subjectId) filter.subjectId = subjectId;
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    let student = null;
    if (req.user.role === 'student') {
      student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      filter['records.studentId'] = student._id;
    }

    const attendanceRecords = await Attendance.find(filter)
      .populate('classId', 'department semester section batch')
      .populate('subjectId', 'subjectName subjectCode')
      .populate({
        path: 'records.studentId',
        populate: { path: 'userId', select: 'name' },
      })
      .sort({ date: -1 });

    // Build CSV rows
    const rows = [];
    rows.push(['Date', 'Department', 'Semester', 'Section', 'Subject', 'Subject Code', 'Student Name', 'Roll No', 'Status', 'Remarks']);

    attendanceRecords.forEach((att) => {
      att.records.forEach((record) => {
        if (student && record.studentId?._id?.toString() !== student._id.toString()) {
          return;
        }
        rows.push([
          att.date.toISOString().split('T')[0],
          att.classId?.department || '',
          att.classId?.semester || '',
          att.classId?.section || '',
          att.subjectId?.subjectName || '',
          att.subjectId?.subjectCode || '',
          record.studentId?.userId?.name || '',
          record.studentId?.rollNo || '',
          record.status || '',
          record.remarks || '',
        ]);
      });
    });

    // Generate CSV string
    const csvContent = rows
      .map((row) =>
        row.map((cell) => {
          const str = String(cell);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('CSV download error:', error);
    res.status(500).json({ message: 'Server error generating CSV report' });
  }
};

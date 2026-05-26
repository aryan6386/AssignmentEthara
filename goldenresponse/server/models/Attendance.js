const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late'],
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    records: [attendanceRecordSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for performance
attendanceSchema.index({ classId: 1, subjectId: 1, date: 1 });
attendanceSchema.index({ teacherId: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

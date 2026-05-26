const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  getStudentReport,
  getClassReport,
  getSubjectReport,
  getLowAttendance,
  downloadCSV,
} = require('../controllers/reportController');

// All routes require authentication
router.use(auth);

// Student attendance report (admin + teacher)
router.get('/student/:studentId', roleCheck('admin', 'teacher'), getStudentReport);

// Class-wise report (admin + teacher)
router.get('/class/:classId', roleCheck('admin', 'teacher'), getClassReport);

// Subject-wise report (admin + teacher)
router.get('/subject/:subjectId', roleCheck('admin', 'teacher'), getSubjectReport);

// Low attendance list (admin + teacher)
router.get('/low-attendance', roleCheck('admin', 'teacher'), getLowAttendance);

// Download CSV report (admin + teacher + student)
router.get('/download/csv', roleCheck('admin', 'teacher', 'student'), downloadCSV);

module.exports = router;

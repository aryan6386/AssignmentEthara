const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  markAttendance,
  editAttendance,
  getByClassAndSubject,
  getHistory,
} = require('../controllers/attendanceController');

// All routes require authentication
router.use(auth);

// Mark attendance (teacher only)
router.post('/mark', roleCheck('teacher'), markAttendance);

// Edit attendance (teacher only)
router.put('/:id', roleCheck('teacher'), editAttendance);

// Get attendance by class and subject (teacher + admin)
router.get('/class/:classId/subject/:subjectId', roleCheck('teacher', 'admin'), getByClassAndSubject);

// Get attendance history (all authenticated users)
router.get('/history', getHistory);

module.exports = router;

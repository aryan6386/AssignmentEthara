const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  getProfile,
  getClasses,
  getSubjects,
  getLowAttendance,
  getDashboard,
} = require('../controllers/teacherController');

// All routes require auth + teacher role
router.use(auth, roleCheck('teacher'));

// Teacher routes
router.get('/profile', getProfile);
router.get('/classes', getClasses);
router.get('/subjects', getSubjects);
router.get('/low-attendance/:classId/:subjectId', getLowAttendance);
router.get('/dashboard', getDashboard);

module.exports = router;

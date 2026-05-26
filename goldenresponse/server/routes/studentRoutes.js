const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  getProfile,
  getAttendance,
  getAttendanceSummary,
  getDashboard,
} = require('../controllers/studentController');

// All routes require auth + student role
router.use(auth, roleCheck('student'));

// Student routes
router.get('/profile', getProfile);
router.get('/attendance/summary', getAttendanceSummary);
router.get('/attendance', getAttendance);
router.get('/dashboard', getDashboard);

module.exports = router;

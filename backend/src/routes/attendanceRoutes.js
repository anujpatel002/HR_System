const express = require('express');
const { markAttendance, getAttendance, getTodayAttendance, getAttendanceSummary, bulkMarkAttendance } = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/mark', authMiddleware, markAttendance);
router.post('/bulk-mark', authMiddleware, roleMiddleware(['ADMIN', 'HR_OFFICER']), bulkMarkAttendance);
router.get('/today', authMiddleware, getTodayAttendance);
router.get('/summary/:userId', authMiddleware, getAttendanceSummary);
router.get('/:userId', authMiddleware, getAttendance);

module.exports = router;
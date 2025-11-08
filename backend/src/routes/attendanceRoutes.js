const express = require('express');
const { markAttendance, getAttendance, getTodayAttendance } = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/mark', authMiddleware, markAttendance);
router.get('/today', authMiddleware, getTodayAttendance);
router.get('/:userId', authMiddleware, getAttendance);

module.exports = router;
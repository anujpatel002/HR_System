const express = require('express');
const { applyLeave, getLeaves, getAllLeaves, updateLeaveStatus } = require('../controllers/leaveController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/apply', authMiddleware, applyLeave);
router.get('/all', authMiddleware, roleMiddleware(['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER']), getAllLeaves);
router.get('/:userId', authMiddleware, getLeaves);
router.put('/approve/:id', authMiddleware, roleMiddleware(['ADMIN', 'HR_OFFICER']), updateLeaveStatus);

module.exports = router;
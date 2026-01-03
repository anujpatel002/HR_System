const express = require('express');
const { applyLeave, getLeaves, getAllLeaves, updateLeaveStatus, getLeaveBalance, cancelLeave } = require('../controllers/leaveController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/apply', authMiddleware, applyLeave);
router.get('/balance/:userId', authMiddleware, getLeaveBalance);
router.get('/all', authMiddleware, roleMiddleware(['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER', 'MANAGER']), getAllLeaves);
router.get('/:userId', authMiddleware, getLeaves);
router.patch('/:id/cancel', authMiddleware, cancelLeave);
router.put('/approve/:id', authMiddleware, roleMiddleware(['ADMIN', 'HR_OFFICER', 'MANAGER']), updateLeaveStatus);

module.exports = router;
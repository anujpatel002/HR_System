const express = require('express');
const { generatePayroll, getPayroll, getAllPayrolls, getPayrollStats } = require('../controllers/payrollController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/generate', authMiddleware, roleMiddleware(['ADMIN', 'PAYROLL_OFFICER']), generatePayroll);
router.get('/stats', authMiddleware, roleMiddleware(['ADMIN', 'PAYROLL_OFFICER']), getPayrollStats);
router.get('/all', authMiddleware, roleMiddleware(['ADMIN', 'PAYROLL_OFFICER']), getAllPayrolls);
router.get('/:userId', authMiddleware, getPayroll);

module.exports = router;
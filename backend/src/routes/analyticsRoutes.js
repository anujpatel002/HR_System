const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// All analytics routes require authentication
router.use(verifyToken);

// Get analytics data - Admin, HR, Payroll officers, and Managers
router.get('/', checkRole(['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER', 'MANAGER']), getAnalytics);

module.exports = router;

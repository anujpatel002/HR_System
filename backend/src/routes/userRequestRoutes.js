const express = require('express');
const { createRequest, getPendingRequests, approveRequest, rejectRequest } = require('../controllers/userRequestController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['HR_OFFICER']), createRequest);
router.get('/pending', authMiddleware, roleMiddleware(['ADMIN']), getPendingRequests);
router.put('/:id/approve', authMiddleware, roleMiddleware(['ADMIN']), approveRequest);
router.put('/:id/reject', authMiddleware, roleMiddleware(['ADMIN']), rejectRequest);

module.exports = router;
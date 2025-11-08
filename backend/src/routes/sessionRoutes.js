const express = require('express');
const { getActiveSessions, terminateSession, getUserActivity } = require('../controllers/sessionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/active', authMiddleware, roleMiddleware(['ADMIN']), getActiveSessions);
router.put('/:sessionId/terminate', authMiddleware, roleMiddleware(['ADMIN']), terminateSession);
router.get('/user/:userId/activity', authMiddleware, roleMiddleware(['ADMIN']), getUserActivity);

module.exports = router;
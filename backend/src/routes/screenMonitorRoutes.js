const express = require('express');
const { getActiveUserScreens, updateUserScreen, updateScreenshot, getUserScreenshot, requestScreenShare, getScreenShareRequest, respondToScreenShare } = require('../controllers/screenMonitorController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/active', authMiddleware, roleMiddleware(['ADMIN']), getActiveUserScreens);
router.post('/update', authMiddleware, updateUserScreen);
router.post('/screenshot', authMiddleware, updateScreenshot);
router.get('/screenshot/:userId', authMiddleware, roleMiddleware(['ADMIN']), getUserScreenshot);
router.post('/request/:userId', authMiddleware, roleMiddleware(['ADMIN']), requestScreenShare);
router.get('/request', authMiddleware, getScreenShareRequest);
router.post('/respond', authMiddleware, respondToScreenShare);

module.exports = router;
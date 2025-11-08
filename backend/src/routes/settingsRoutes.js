const express = require('express');
const { getWorkSettings, updateWorkSettings } = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/work', authMiddleware, getWorkSettings);
router.put('/work', authMiddleware, roleMiddleware(['ADMIN']), updateWorkSettings);

module.exports = router;
const express = require('express');
const { getActivities } = require('../controllers/activityController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', authMiddleware, roleMiddleware(['ADMIN']), getActivities);

module.exports = router;
const express = require('express');
const { getAllUsers, getUserById, createUser, updateUser, deleteUser, getDepartments, getManagers } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

const router = express.Router();

// Cache GET requests for 30 seconds - Allow employees to see basic user list
router.get('/', authMiddleware, roleMiddleware(['ADMIN', 'HR_OFFICER', 'EMPLOYEE', 'MANAGER']), cacheMiddleware(30000), getAllUsers);
router.get('/:id', authMiddleware, cacheMiddleware(60000), getUserById);
router.post('/', authMiddleware, roleMiddleware(['ADMIN']), createUser);
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN', 'HR_OFFICER', 'EMPLOYEE', 'MANAGER']), updateUser);
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN']), deleteUser);
router.get('/departments/list', authMiddleware, cacheMiddleware(300000), getDepartments); // Cache 5 minutes
router.get('/managers/list', authMiddleware, roleMiddleware(['ADMIN', 'HR_OFFICER', 'EMPLOYEE', 'MANAGER']), cacheMiddleware(60000), getManagers);

module.exports = router;
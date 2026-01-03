const express = require('express');
const { getAllUsers, getUserById, createUser, updateUser, deleteUser, getDepartments, getManagers, bulkUpdateUsers } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

const router = express.Router();

router.get('/', authMiddleware, roleMiddleware(['ADMIN', 'HR_OFFICER', 'MANAGER', 'EMPLOYEE']), cacheMiddleware(30000), getAllUsers);
router.get('/:id', authMiddleware, cacheMiddleware(60000), getUserById);
router.post('/', authMiddleware, roleMiddleware(['ADMIN']), createUser);
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN', 'HR_OFFICER', 'EMPLOYEE', 'MANAGER']), updateUser);
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN']), deleteUser);
router.post('/bulk-update', authMiddleware, roleMiddleware(['ADMIN', 'HR_OFFICER']), bulkUpdateUsers);
router.get('/departments/list', authMiddleware, cacheMiddleware(300000), getDepartments);
router.get('/managers/list', authMiddleware, cacheMiddleware(60000), getManagers);

module.exports = router;
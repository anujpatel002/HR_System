const express = require('express');
const { getAllUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', authMiddleware, roleMiddleware(['ADMIN', 'HR_OFFICER', 'EMPLOYEE']), getAllUsers);
router.get('/:id', authMiddleware, getUserById);
router.post('/', authMiddleware, roleMiddleware(['ADMIN']), createUser);
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN', 'HR_OFFICER']), updateUser);
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN']), deleteUser);

module.exports = router;
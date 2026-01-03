const express = require('express');
const { register, login, logout, getProfile, forgotPassword, resetPassword, sendVerificationOTP, verifyEmailOTP } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/send-otp', sendVerificationOTP);
router.post('/verify-otp', verifyEmailOTP);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.get('/profile', authMiddleware, getProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
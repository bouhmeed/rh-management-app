// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
    register,
    login,
    logout,
    getMe,
    deleteUser
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.delete('/users/:email', protect, authorize('Admin'), deleteUser);

module.exports = router;
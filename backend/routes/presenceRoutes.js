// backend/routes/presenceRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    clockIn,
    clockOut,
    getTodayPresence,
    markAttendance,
    getPresences,
    getStats,
    deletePresence,
    updatePresence
} = require('../controllers/presenceController');

// @desc    Clock in
// @route   POST /api/presences/clock-in/:employeId
// @access  Private
router.post('/clock-in/:employeId', protect, clockIn);

// @desc    Clock out
// @route   POST /api/presences/clock-out/:employeId
// @access  Private
router.post('/clock-out/:employeId', protect, clockOut);

// @desc    Get today's presence for employee
// @route   GET /api/presences/today/:employeId
// @access  Private
router.get('/today/:employeId', protect, getTodayPresence);

// @desc    Mark attendance (admin)
// @route   POST /api/presences/mark/:id
// @access  Private (Admin, Manager RH)
router.post('/mark/:id', protect, authorize('Admin', 'Manager RH'), markAttendance);

// @desc    Get all presences
// @route   GET /api/presences
// @access  Private
router.get('/', protect, getPresences);

// @desc    Get presence stats
// @route   GET /api/presences/stats
// @access  Private
router.get('/stats', protect, getStats);

// @desc    Delete a presence
// @route   DELETE /api/presences/:id
// @access  Private
router.delete('/:id', protect, deletePresence);

// @desc    Update a presence
// @route   PUT /api/presences/:id
// @access  Private
router.put('/:id', protect, updatePresence);

module.exports = router;

// backend/routes/employeRoutes.js
const express = require('express');
const router = express.Router();
const {
    createEmploye,
    getEmployes,
    getEmploye,
    updateEmploye,
    deleteEmploye
} = require('../controllers/employeController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .post(protect, authorize('Admin', 'Manager RH'), createEmploye)
    .get(protect, getEmployes);

router.route('/:id')
    .get(protect, getEmploye)
    .put(protect, authorize('Admin', 'Manager RH'), updateEmploye)
    .delete(protect, authorize('Admin'), deleteEmploye);

module.exports = router;
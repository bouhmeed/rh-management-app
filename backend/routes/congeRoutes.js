// backend/routes/congeRoutes.js
const express = require('express');
const router = express.Router();
const {
    demanderConge,
    approuverConge,
    refuserConge,
    getConges,
    getMyConges
} = require('../controllers/congeController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .post(protect, demanderConge)
    .get(protect, getConges);

router.route('/my-conges')
    .get(protect, getMyConges);

router.put('/:id/approuver', protect, authorize('Admin', 'Manager', 'Manager RH'), approuverConge);
router.put('/:id/refuser', protect, authorize('Admin', 'Manager', 'Manager RH'), refuserConge);

module.exports = router;
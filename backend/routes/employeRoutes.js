// backend/routes/employeRoutes.js
const express = require('express');
const router = express.Router();
const {
    createEmploye,
    createEmployeWithContract,
    getEmployes,
    getEmploye,
    updateEmploye,
    deleteEmploye,
    updatePayrollTemplate,
    getPayrollTemplate
} = require('../controllers/employeController');
const { protect, authorize } = require('../middleware/auth');

router.post('/with-contract', protect, authorize('Admin', 'Manager RH'), (req, res, next) => {
    console.log('Route /with-contract atteinte');
    createEmployeWithContract(req, res, next);
});

router.route('/')
    .post(protect, authorize('Admin', 'Manager RH'), createEmploye)
    .get(protect, getEmployes);

router.route('/:id')
    .get(protect, getEmploye)
    .put(protect, authorize('Admin', 'Manager RH'), updateEmploye)
    .delete(protect, authorize('Admin'), deleteEmploye);

// Routes pour la gestion du modèle de paie
router.put('/:id/payroll-template', protect, authorize('Admin', 'Manager RH'), updatePayrollTemplate);
router.get('/:id/payroll-template', protect, authorize('Admin', 'Manager RH'), getPayrollTemplate);

module.exports = router;
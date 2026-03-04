// backend/routes/departementRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createDepartement,
    getDepartements,
    addEmployeToDepartement,
    updateDepartement,
    deleteDepartement
} = require('../controllers/departementController');

// @desc    Créer un département
// @route   POST /api/departements
// @access  Private (Admin, Manager RH)
router.post('/', protect, authorize('Admin', 'Manager RH'), createDepartement);

// @desc    Obtenir tous les départements
// @route   GET /api/departements
// @access  Private
router.get('/', protect, getDepartements);

// @desc    Ajouter un employé à un département
// @route   POST /api/departements/:id/employes/:employeId
// @access  Private (Admin, Manager RH)
router.post('/:id/employes/:employeId', protect, authorize('Admin', 'Manager RH'), addEmployeToDepartement);

// @desc    Modifier un département
// @route   PUT /api/departements/:id
// @access  Private (Admin, Manager RH)
router.put('/:id', protect, authorize('Admin', 'Manager RH'), updateDepartement);

// @desc    Supprimer un département
// @route   DELETE /api/departements/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('Admin'), deleteDepartement);

module.exports = router;
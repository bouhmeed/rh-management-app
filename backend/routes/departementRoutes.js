// backend/routes/departementRoutes.js
const express = require('express');
const router = express.Router();
const Departement = require('../models/Departement');
const { protect, authorize } = require('../middleware/auth');

// @desc    Créer un département
// @route   POST /api/departements
// @access  Private (Admin, Manager RH)
router.post('/', protect, authorize('Admin', 'Manager RH'), async (req, res) => {
    try {
        const departement = await Departement.create(req.body);
        res.status(201).json({
            success: true,
            data: departement
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Obtenir tous les départements
// @route   GET /api/departements
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const departements = await Departement.find()
            .populate('responsable', 'nom prenom')
            .populate('employes', 'nom prenom matricule');
        
        res.status(200).json({
            success: true,
            count: departements.length,
            data: departements
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Ajouter un employé à un département
// @route   POST /api/departements/:id/employes/:employeId
// @access  Private (Admin, Manager RH)
router.post('/:id/employes/:employeId', protect, authorize('Admin', 'Manager RH'), async (req, res) => {
    try {
        const departement = await Departement.findById(req.params.id);
        
        if (!departement) {
            return res.status(404).json({
                success: false,
                message: 'Département non trouvé'
            });
        }

        await departement.ajouterEmploye(req.params.employeId);

        res.status(200).json({
            success: true,
            data: departement
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
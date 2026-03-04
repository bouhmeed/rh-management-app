// backend/routes/presenceRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createPresence,
    getPresences,
    getPresence,
    updatePresence,
    deletePresence,
    enregistrerEntree,
    enregistrerSortie
} = require('../controllers/presenceController');

// @desc    Créer une présence
// @route   POST /api/presences
// @access  Private (Admin, Manager RH)
router.post('/', protect, authorize('Admin', 'Manager RH'), createPresence);

// @desc    Obtenir toutes les présences
// @route   GET /api/presences
// @access  Private
router.get('/', protect, getPresences);

// @desc    Obtenir une présence par ID
// @route   GET /api/presences/:id
// @access  Private
router.get('/:id', protect, getPresence);

// @desc    Modifier une présence
// @route   PUT /api/presences/:id
// @access  Private (Admin, Manager RH)
router.put('/:id', protect, authorize('Admin', 'Manager RH'), updatePresence);

// @desc    Supprimer une présence
// @route   DELETE /api/presences/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('Admin'), deletePresence);

// @desc    Enregistrer l'entrée
// @route   POST /api/presences/entree/:employeId
// @access  Private
router.post('/entree/:employeId', protect, enregistrerEntree);

// @desc    Enregistrer la sortie
// @route   POST /api/presences/sortie/:employeId
// @access  Private
router.post('/sortie/:employeId', protect, enregistrerSortie);

module.exports = router;

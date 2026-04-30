// backend/routes/contratRoutes.js
const express = require('express');
const router = express.Router();
const {
    getAllContrats,
    getMyContract,
    getContratById,
    createContrat,
    updateContrat,
    deleteContrat,
    resilierContrat
} = require('../controllers/contratController');

// Middleware d'authentification
const { protect } = require('../middleware/auth');

// Routes protégées
router.use(protect);

// Routes pour tous les rôles (employés voient leur contrat)
router.get('/my-contract', getMyContract);
router.get('/:id', getContratById);

// Routes pour Admin, Manager RH, Manager
router.route('/')
    .get(getAllContrats)
    .post(createContrat);

router.route('/:id')
    .put(updateContrat)
    .delete(deleteContrat);

// Route spéciale pour résilier
router.put('/:id/resilier', resilierContrat);

module.exports = router;

// backend/routes/paieRoutes.js
const express = require('express');
const router = express.Router();
const {
    getAllPaies,
    getMyPaies,
    getPaieById,
    createPaie,
    updatePaie,
    deletePaie,
    validerPaie,
    payerPaie
} = require('../controllers/paieController');

// Middleware d'authentification
const { protect, authorize } = require('../middleware/auth');

// Routes protégées
router.use(protect);

// Routes pour tous les rôles (employés voient leurs paies)
router.get('/my-paies', getMyPaies);
router.get('/:id', getPaieById);

// Routes pour Admin, Manager RH
router.route('/')
    .get(getAllPaies)
    .post(createPaie);

router.route('/:id')
    .put(updatePaie)
    .delete(deletePaie);

// Routes spéciales pour validation et paiement
router.put('/:id/valider', validerPaie);
router.put('/:id/payer', payerPaie);

module.exports = router;

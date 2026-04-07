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
    enregistrerSortie,
    startWork,
    pauseWork,
    resumeWork,
    endWork,
    getCurrentSession,
    getTodayStats,
    getWeekStats,
    getMonthStats,
    getAdminStats,
    getAnomalies,
    getSystemStatus,
    getAnalytics,
    exportData
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

// @desc    Démarrer le travail
// @route   POST /api/presences/start/:employeId
// @access  Private
router.post('/start/:employeId', protect, startWork);

// @desc    Mettre en pause
// @route   POST /api/presences/pause/:employeId
// @access  Private
router.post('/pause/:employeId', protect, pauseWork);

// @desc    Reprendre le travail
// @route   POST /api/presences/resume/:employeId
// @access  Private
router.post('/resume/:employeId', protect, resumeWork);

// @desc    Terminer le travail
// @route   POST /api/presences/end/:employeId
// @access  Private
router.post('/end/:employeId', protect, endWork);

// @desc    Obtenir la session actuelle
// @route   GET /api/presences/current/:employeId
// @access  Private
router.get('/current/:employeId', protect, getCurrentSession);

// @desc    Obtenir les statistiques du jour
// @route   GET /api/presences/stats/today/:employeId
// @access  Private
router.get('/stats/today/:employeId', protect, getTodayStats);

// @desc    Obtenir les statistiques de la semaine
// @route   GET /api/presences/stats/week/:employeId
// @access  Private
router.get('/stats/week/:employeId', protect, getWeekStats);

// @desc    Obtenir les statistiques du mois
// @route   GET /api/presences/stats/month/:employeId
// @access  Private
router.get('/stats/month/:employeId', protect, getMonthStats);

// @desc    Obtenir les statistiques admin
// @route   GET /api/presences/stats/admin
// @access  Private (Admin, Manager RH)
router.get('/stats/admin', protect, authorize('Admin', 'Manager RH'), getAdminStats);

// @desc    Obtenir les anomalies
// @route   GET /api/presences/anomalies
// @access  Private (Admin, Manager RH)
router.get('/anomalies', protect, authorize('Admin', 'Manager RH'), getAnomalies);

// @desc    Obtenir le statut du système
// @route   GET /api/presences/system/status
// @access  Private
router.get('/system/status', protect, getSystemStatus);

// @desc    Obtenir les analytiques
// @route   GET /api/presences/analytics
// @access  Private (Admin, Manager RH)
router.get('/analytics', protect, authorize('Admin', 'Manager RH'), getAnalytics);

// @desc    Exporter les données
// @route   GET /api/presences/export
// @access  Private (Admin, Manager RH)
router.get('/export', protect, authorize('Admin', 'Manager RH'), exportData);

module.exports = router;

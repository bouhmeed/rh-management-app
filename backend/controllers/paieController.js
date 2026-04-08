// backend/controllers/paieController.js
const Paie = require('../models/Paie');
const Employe = require('../models/Employe');

// @desc    Récupérer toutes les paies
// @route   GET /api/paies
// @access  Private (Admin, Manager RH, Manager)
exports.getAllPaies = async (req, res) => {
    try {
        const { mois, statut, employe } = req.query;
        let query = {};
        
        // Filtrage
        if (mois) query.mois = mois;
        if (statut) query.statut = statut;
        if (employe) query.employe = employe;
        
        const paies = await Paie.find(query)
            .populate('employe', 'nom prenom email matricule')
            .sort({ mois: -1, createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: paies.length,
            data: paies
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des paies',
            error: error.message
        });
    }
};

// @desc    Récupérer les paies de l'employé connecté
// @route   GET /api/paies/my-paies
// @access  Private (Employé)
exports.getMyPaies = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const Employe = require('../models/Employe');
        
        // Récupérer l'employé connecté
        const employe = await Employe.findOne({ 
            utilisateur: new mongoose.Types.ObjectId(req.utilisateur._id) 
        });
        
        if (!employe) {
            return res.status(404).json({
                success: false,
                message: 'Employé non trouvé'
            });
        }

        const { mois, statut } = req.query;
        let query = { employe: employe._id };
        
        if (mois) query.mois = mois;
        if (statut) query.statut = statut;
        
        const paies = await Paie.find(query)
            .populate('employe', 'nom prenom email matricule')
            .sort({ mois: -1, createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: paies.length,
            data: paies
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des paies',
            error: error.message
        });
    }
};

// @desc    Récupérer une paie par ID
// @route   GET /api/paies/:id
// @access  Private
exports.getPaieById = async (req, res) => {
    try {
        const paie = await Paie.findById(req.params.id)
            .populate('employe', 'nom prenom email matricule departement');

        if (!paie) {
            return res.status(404).json({
                success: false,
                message: 'Paie non trouvée'
            });
        }

        // Vérifier les autorisations
        const userRole = req.utilisateur.role.nomRole;
        const mongoose = require('mongoose');
        const Employe = require('../models/Employe');
        
        if (userRole === 'Employé') {
            const employe = await Employe.findOne({ 
                utilisateur: new mongoose.Types.ObjectId(req.utilisateur._id) 
            });
            
            if (!employe._id.equals(paie.employe._id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès non autorisé'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: paie
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la paie',
            error: error.message
        });
    }
};

// @desc    Créer une paie
// @route   POST /api/paies
// @access  Private (Admin, Manager RH)
exports.createPaie = async (req, res) => {
    try {
        const paieData = req.body;
        
        // Vérifier si une paie existe déjà pour cet employé et ce mois
        const existingPaie = await Paie.findOne({ 
            employe: paieData.employe, 
            mois: paieData.mois 
        });
        
        if (existingPaie) {
            return res.status(400).json({
                success: false,
                message: 'Une paie existe déjà pour cet employé ce mois-ci'
            });
        }

        // Calculer le salaire automatiquement
        const paie = new Paie(paieData);
        await paie.calculerSalaire();
        
        await paie.save();
        
        const populatedPaie = await Paie.findById(paie._id)
            .populate('employe', 'nom prenom email matricule');
        
        res.status(201).json({
            success: true,
            message: 'Paie créée avec succès',
            data: populatedPaie
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur lors de la création de la paie',
            error: error.message
        });
    }
};

// @desc    Mettre à jour une paie
// @route   PUT /api/paies/:id
// @access  Private (Admin, Manager RH)
exports.updatePaie = async (req, res) => {
    try {
        let paie = await Paie.findById(req.params.id);

        if (!paie) {
            return res.status(404).json({
                success: false,
                message: 'Paie non trouvée'
            });
        }

        // Mettre à jour les données
        Object.assign(paie, req.body);
        
        // Recalculer le salaire
        await paie.calculerSalaire();
        
        await paie.save();
        
        const updatedPaie = await Paie.findById(paie._id)
            .populate('employe', 'nom prenom email matricule');
        
        res.status(200).json({
            success: true,
            message: 'Paie mise à jour avec succès',
            data: updatedPaie
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la paie',
            error: error.message
        });
    }
};

// @desc    Supprimer une paie
// @route   DELETE /api/paies/:id
// @access  Private (Admin, Manager RH)
exports.deletePaie = async (req, res) => {
    try {
        const paie = await Paie.findById(req.params.id);

        if (!paie) {
            return res.status(404).json({
                success: false,
                message: 'Paie non trouvée'
            });
        }

        // Vérifier si la paie est déjà payée
        if (paie.statut === 'Payé') {
            return res.status(400).json({
                success: false,
                message: 'Impossible de supprimer une paie déjà payée'
            });
        }

        await paie.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Paie supprimée avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la paie',
            error: error.message
        });
    }
};

// @desc    Valider une paie
// @route   PUT /api/paies/:id/valider
// @access  Private (Admin, Manager RH)
exports.validerPaie = async (req, res) => {
    try {
        const paie = await Paie.findById(req.params.id);

        if (!paie) {
            return res.status(404).json({
                success: false,
                message: 'Paie non trouvée'
            });
        }

        if (paie.statut !== 'Brouillon') {
            return res.status(400).json({
                success: false,
                message: 'Seules les paies en brouillon peuvent être validées'
            });
        }

        paie.statut = 'Validé';
        await paie.save();

        const updatedPaie = await Paie.findById(paie._id)
            .populate('employe', 'nom prenom email matricule');
        
        res.status(200).json({
            success: true,
            message: 'Paie validée avec succès',
            data: updatedPaie
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur lors de la validation de la paie',
            error: error.message
        });
    }
};

// @desc    Marquer une paie comme payée
// @route   PUT /api/paies/:id/payer
// @access  Private (Admin, Manager RH)
exports.payerPaie = async (req, res) => {
    try {
        const paie = await Paie.findById(req.params.id);

        if (!paie) {
            return res.status(404).json({
                success: false,
                message: 'Paie non trouvée'
            });
        }

        if (paie.statut !== 'Validé') {
            return res.status(400).json({
                success: false,
                message: 'Seules les paies validées peuvent être payées'
            });
        }

        paie.statut = 'Payé';
        paie.datePaiement = new Date();
        await paie.save();

        const updatedPaie = await Paie.findById(paie._id)
            .populate('employe', 'nom prenom email matricule');
        
        res.status(200).json({
            success: true,
            message: 'Paie marquée comme payée avec succès',
            data: updatedPaie
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur lors du paiement de la paie',
            error: error.message
        });
    }
};

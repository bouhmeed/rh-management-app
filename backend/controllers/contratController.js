// backend/controllers/contratController.js
const Contrat = require('../models/Contrat');
const Employe = require('../models/Employe');

// @desc    Récupérer tous les contrats
// @route   GET /api/contrats
// @access  Private (Admin, Manager RH, Manager)
exports.getAllContrats = async (req, res) => {
    try {
        const contrats = await Contrat.find()
            .populate('employe', 'nom prenom email matricule')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: contrats.length,
            data: contrats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des contrats',
            error: error.message
        });
    }
};

// @desc    Récupérer le contrat de l'employé connecté
// @route   GET /api/contrats/my-contract
// @access  Private (Employé)
exports.getMyContract = async (req, res) => {
    try {
        // Récupérer l'employé connecté
        const Employe = require('../models/Employe');
        
        // req.utilisateur est déjà populé par le middleware auth
        const mongoose = require('mongoose');
        const employe = await Employe.findOne({ utilisateur: new mongoose.Types.ObjectId(req.utilisateur._id) });
        
        if (!employe) {
            return res.status(404).json({
                success: false,
                message: 'Employé non trouvé'
            });
        }

        const contrat = await Contrat.findOne({ employe: employe._id })
            .populate('employe', 'nom prenom email matricule');

        if (!contrat) {
            return res.status(404).json({
                success: false,
                message: 'Aucun contrat trouvé pour cet employé'
            });
        }

        res.status(200).json({
            success: true,
            data: contrat
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du contrat',
            error: error.message
        });
    }
};

// @desc    Récupérer un contrat par ID
// @route   GET /api/contrats/:id
// @access  Private
exports.getContratById = async (req, res) => {
    try {
        const contrat = await Contrat.findById(req.params.id)
            .populate('employe', 'nom prenom email matricule');

        if (!contrat) {
            return res.status(404).json({
                success: false,
                message: 'Contrat non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: contrat
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du contrat',
            error: error.message
        });
    }
};

// @desc    Créer un contrat
// @route   POST /api/contrats
// @access  Private (Admin, Manager RH, Manager)
exports.createContrat = async (req, res) => {
    try {
        const contratData = req.body;

        // Vérifier si l'employé existe
        const employe = await Employe.findById(contratData.employe);
        if (!employe) {
            return res.status(404).json({
                success: false,
                message: 'Employé non trouvé'
            });
        }

        // Vérifier si un contrat actif existe déjà pour cet employé
        const existingContrat = await Contrat.findOne({ 
            employe: contratData.employe,
            statut: 'Actif'
        });

        if (existingContrat) {
            return res.status(400).json({
                success: false,
                message: 'Cet employé a déjà un contrat actif'
            });
        }

        const contrat = await Contrat.create(contratData);

        // Mettre à jour le statut du contrat précédent si nécessaire
        if (existingContrat) {
            await Contrat.findByIdAndUpdate(existingContrat._id, { 
                statut: 'Expiré',
                dateFin: new Date()
            });
        }

        res.status(201).json({
            success: true,
            message: 'Contrat créé avec succès',
            data: contrat
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur lors de la création du contrat',
            error: error.message
        });
    }
};

// @desc    Mettre à jour un contrat
// @route   PUT /api/contrats/:id
// @access  Private (Admin, Manager RH, Manager)
exports.updateContrat = async (req, res) => {
    try {
        let contrat = await Contrat.findById(req.params.id);

        if (!contrat) {
            return res.status(404).json({
                success: false,
                message: 'Contrat non trouvé'
            });
        }

        contrat = await Contrat.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('employe', 'nom prenom email matricule');

        res.status(200).json({
            success: true,
            message: 'Contrat mis à jour avec succès',
            data: contrat
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur lors de la mise à jour du contrat',
            error: error.message
        });
    }
};

// @desc    Supprimer un contrat
// @route   DELETE /api/contrats/:id
// @access  Private (Admin, Manager RH, Manager)
exports.deleteContrat = async (req, res) => {
    try {
        const contrat = await Contrat.findById(req.params.id);

        if (!contrat) {
            return res.status(404).json({
                success: false,
                message: 'Contrat non trouvé'
            });
        }

        await contrat.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Contrat supprimé avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du contrat',
            error: error.message
        });
    }
};

// @desc    Résilier un contrat
// @route   PUT /api/contrats/:id/resilier
// @access  Private (Admin, Manager RH, Manager)
exports.resilierContrat = async (req, res) => {
    try {
        const { raison } = req.body;
        
        const contrat = await Contrat.findById(req.params.id);
        if (!contrat) {
            return res.status(404).json({
                success: false,
                message: 'Contrat non trouvé'
            });
        }

        contrat.statut = 'Résilié';
        contrat.dateFin = new Date();
        await contrat.save();

        res.status(200).json({
            success: true,
            message: 'Contrat résilié avec succès',
            data: contrat
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur lors de la résiliation du contrat',
            error: error.message
        });
    }
};

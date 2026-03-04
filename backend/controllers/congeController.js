// backend/controllers/congeController.js
const Conge = require('../models/Conge');
const Employe = require('../models/Employe');

// @desc    Demander un congé
// @route   POST /api/conges
// @access  Private
exports.demanderConge = async (req, res) => {
    try {
        const congeData = {
            ...req.body,
            employe: req.body.employe || req.utilisateur.employe
        };

        // Vérifier que l'employé existe
        if (!congeData.employe) {
            return res.status(400).json({
                success: false,
                message: 'ID employé requis'
            });
        }

        // Parser les dates
        congeData.dateDebut = new Date(congeData.dateDebut);
        congeData.dateFin = new Date(congeData.dateFin);

        if (isNaN(congeData.dateDebut.getTime()) || isNaN(congeData.dateFin.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Dates invalides'
            });
        }

        // Vérifier que dateFin >= dateDebut
        if (congeData.dateFin < congeData.dateDebut) {
            return res.status(400).json({
                success: false,
                message: 'La date de fin doit être postérieure à la date de début'
            });
        }

        // Calculer le nombre de jours
        const diffTime = Math.abs(congeData.dateFin - congeData.dateDebut);
        congeData.joursDemandes = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Vérifier les congés existants pour la période
        // const congesExistants = await Conge.find({
        //     employe: congeData.employe,
        //     statut: { $in: ['En attente', 'Approuvé'] },
        //     $or: [
        //         {
        //             dateDebut: { $lte: congeData.dateFin },
        //             dateFin: { $gte: congeData.dateDebut }
        //         }
        //     ]
        // });

        // if (congesExistants.length > 0) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Une demande de congé existe déjà pour cette période'
        //     });
        // }

        const conge = await Conge.create(congeData);

        res.status(201).json({
            success: true,
            data: conge
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Approuver un congé
// @route   PUT /api/conges/:id/approuver
// @access  Private (Manager, Manager RH)
exports.approuverConge = async (req, res) => {
    try {
        const conge = await Conge.findById(req.params.id);

        if (!conge) {
            return res.status(404).json({
                success: false,
                message: 'Demande de congé non trouvée'
            });
        }

        await conge.approuver(req.utilisateur._id);

        res.status(200).json({
            success: true,
            data: conge
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Refuser un congé
// @route   PUT /api/conges/:id/refuser
// @access  Private (Manager, Manager RH)
exports.refuserConge = async (req, res) => {
    try {
        const conge = await Conge.findById(req.params.id);

        if (!conge) {
            return res.status(404).json({
                success: false,
                message: 'Demande de congé non trouvée'
            });
        }

        await conge.refuser(req.utilisateur._id, req.body.raison);

        res.status(200).json({
            success: true,
            data: conge
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtenir tous les congés
// @route   GET /api/conges
// @access  Private
exports.getConges = async (req, res) => {
    try {
        const filter = {};
        
        // Filtrer par employé si non-admin
        if (req.utilisateur.role.nomRole === 'Employé') {
            filter.employe = req.utilisateur.employe;
        }
        
        if (req.query.employe) filter.employe = req.query.employe;
        if (req.query.statut) filter.statut = req.query.statut;
        if (req.query.type) filter.type = req.query.type;

        const conges = await Conge.find(filter)
            .populate('employe', 'nom prenom matricule')
            .populate('approuvePar', 'email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: conges.length,
            data: conges
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
    
};
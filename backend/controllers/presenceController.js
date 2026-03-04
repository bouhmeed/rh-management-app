// backend/controllers/presenceController.js
const Presence = require('../models/Presence');
const Employe = require('../models/Employe');

// @desc    Créer une entrée de présence
// @route   POST /api/presences
// @access  Private
exports.createPresence = async (req, res) => {
    try {
        const presence = await Presence.create(req.body);

        res.status(201).json({
            success: true,
            data: presence
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtenir toutes les présences
// @route   GET /api/presences
// @access  Private
exports.getPresences = async (req, res) => {
    try {
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Filtres
        const filter = {};
        if (req.query.employe) filter.employe = req.query.employe;
        if (req.query.date) filter.date = req.query.date;
        if (req.query.statut) filter.statut = req.query.statut;
        if (req.query.recherche) {
            filter.$text = { $search: req.query.recherche };
        }

        // Exécuter la requête
        const presences = await Presence.find(filter)
            .populate('employe', 'nom prenom matricule')
            .skip(skip)
            .limit(limit)
            .sort({ date: -1, createdAt: -1 });

        const total = await Presence.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: presences.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: presences
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtenir une présence par ID
// @route   GET /api/presences/:id
// @access  Private
exports.getPresence = async (req, res) => {
    try {
        const presence = await Presence.findById(req.params.id)
            .populate('employe');

        if (!presence) {
            return res.status(404).json({
                success: false,
                message: 'Présence non trouvée'
            });
        }

        res.status(200).json({
            success: true,
            data: presence
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Mettre à jour une présence
// @route   PUT /api/presences/:id
// @access  Private
exports.updatePresence = async (req, res) => {
    try {
        let presence = await Presence.findById(req.params.id);

        if (!presence) {
            return res.status(404).json({
                success: false,
                message: 'Présence non trouvée'
            });
        }

        presence = await Presence.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after', runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: presence
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Supprimer une présence
// @route   DELETE /api/presences/:id
// @access  Private
exports.deletePresence = async (req, res) => {
    try {
        const presence = await Presence.findById(req.params.id);

        if (!presence) {
            return res.status(404).json({
                success: false,
                message: 'Présence non trouvée'
            });
        }

        await Presence.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Présence supprimée avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Enregistrer l'entrée d'un employé
// @route   POST /api/presences/entree/:employeId
// @access  Private
exports.enregistrerEntree = async (req, res) => {
    try {
        const employe = await Employe.findById(req.params.employeId);

        if (!employe) {
            return res.status(404).json({
                success: false,
                message: 'Employé non trouvé'
            });
        }

        // Vérifier s'il y a déjà une présence pour aujourd'hui
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let presence = await Presence.findOne({
            employe: req.params.employeId,
            date: { $gte: today, $lt: tomorrow }
        });

        if (!presence) {
            presence = new Presence({ employe: req.params.employeId });
        }

        await presence.enregistrerEntree();

        res.status(200).json({
            success: true,
            data: presence
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Enregistrer la sortie d'un employé
// @route   POST /api/presences/sortie/:employeId
// @access  Private
exports.enregistrerSortie = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const presence = await Presence.findOne({
            employe: req.params.employeId,
            date: { $gte: today, $lt: tomorrow }
        });

        if (!presence) {
            return res.status(404).json({
                success: false,
                message: 'Aucune présence trouvée pour aujourd\'hui'
            });
        }

        await presence.enregistrerSortie();

        res.status(200).json({
            success: true,
            data: presence
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

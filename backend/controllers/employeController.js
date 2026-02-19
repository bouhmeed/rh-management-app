// backend/controllers/employeController.js
const Employe = require('../models/Employe');
const Departement = require('../models/Departement');
const Utilisateur = require('../models/Utilisateur');
const Role = require('../models/Role'); // Ajouter cette ligne

// @desc    Créer un employé
// @route   POST /api/employes
// @access  Private (Admin, Manager RH)
exports.createEmploye = async (req, res) => {
    try {
        const { email, ...employeData } = req.body;

        // Générer un matricule unique
        const annee = new Date().getFullYear();
        const count = await Employe.countDocuments();
        employeData.matricule = `EMP${annee}${(count + 1).toString().padStart(4, '0')}`;

        // Créer l'employé
        const employe = await Employe.create(employeData);

        // Si un email est fourni, créer un utilisateur associé
        if (email) {
            // Trouver le rôle "Employé"
            const role = await Role.findOne({ nomRole: 'Employé' });
            
            // Créer l'utilisateur avec un mot de passe par défaut
            const utilisateur = await Utilisateur.create({
                email,
                motDePasse: 'temporaire123', // À changer à la première connexion
                role: role._id,
                employe: employe._id
            });

            employe.utilisateur = utilisateur._id;
            await employe.save();
        }

        // Ajouter l'employé à son département
        if (employe.departement) {
            await Departement.findByIdAndUpdate(employe.departement, {
                $addToSet: { employes: employe._id }
            });
        }

        res.status(201).json({
            success: true,
            data: employe
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtenir tous les employés
// @route   GET /api/employes
// @access  Private
exports.getEmployes = async (req, res) => {
    try {
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Filtres
        const filter = {};
        if (req.query.departement) filter.departement = req.query.departement;
        if (req.query.statut) filter.statut = req.query.statut;
        if (req.query.recherche) {
            filter.$text = { $search: req.query.recherche };
        }

        // Exécuter la requête
        const employes = await Employe.find(filter)
            .populate('departement', 'nomDepartement')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Employe.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: employes.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: employes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtenir un employé par ID
// @route   GET /api/employes/:id
// @access  Private
exports.getEmploye = async (req, res) => {
    try {
        const employe = await Employe.findById(req.params.id)
            .populate('departement')
            .populate({
                path: 'utilisateur',
                select: 'email actif derniereConnexion'
            });

        if (!employe) {
            return res.status(404).json({
                success: false,
                message: 'Employé non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: employe
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Mettre à jour un employé
// @route   PUT /api/employes/:id
// @access  Private
exports.updateEmploye = async (req, res) => {
    try {
        let employe = await Employe.findById(req.params.id);

        if (!employe) {
            return res.status(404).json({
                success: false,
                message: 'Employé non trouvé'
            });
        }

        // Sauvegarder l'ancien département pour la mise à jour
        const ancienDepartement = employe.departement;

        // Mettre à jour
        employe = await Employe.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after' , runValidators: true }
        );

        // Si le département a changé
        if (ancienDepartement && ancienDepartement.toString() !== employe.departement?.toString()) {
            // Retirer de l'ancien département
            if (ancienDepartement) {
                await Departement.findByIdAndUpdate(ancienDepartement, {
                    $pull: { employes: employe._id }
                });
            }
            
            // Ajouter au nouveau département
            if (employe.departement) {
                await Departement.findByIdAndUpdate(employe.departement, {
                    $addToSet: { employes: employe._id }
                });
            }
        }

        res.status(200).json({
            success: true,
            data: employe
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Supprimer un employé
// @route   DELETE /api/employes/:id
// @access  Private (Admin seulement)
exports.deleteEmploye = async (req, res) => {
    try {
        const employe = await Employe.findById(req.params.id);

        if (!employe) {
            return res.status(404).json({
                success: false,
                message: 'Employé non trouvé'
            });
        }

        // Retirer du département
        if (employe.departement) {
            await Departement.findByIdAndUpdate(employe.departement, {
                $pull: { employes: employe._id }
            });
        }

        // Désactiver l'utilisateur associé
        if (employe.utilisateur) {
            await Utilisateur.findByIdAndUpdate(employe.utilisateur, {
                actif: false
            });
        }

        await employe.remove();

        res.status(200).json({
            success: true,
            message: 'Employé supprimé avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
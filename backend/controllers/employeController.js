// backend/controllers/employeController.js
const Employe = require('../models/Employe');
const Departement = require('../models/Departement');
const Utilisateur = require('../models/Utilisateur');
const Role = require('../models/Role');
const Contrat = require('../models/Contrat');
const bcrypt = require('bcryptjs');

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
            
            // Hash le mot de passe temporaire
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('temporaire123', salt);
            
            // Créer l'utilisateur avec un mot de passe hashé
            const utilisateur = await Utilisateur.create({
                email,
                motDePasse: hashedPassword, // Mot de passe hashé
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

// @desc    Créer un employé avec son contrat
// @route   POST /api/employes/with-contract
// @access  Private (Admin, Manager RH)
exports.createEmployeWithContract = async (req, res) => {
    try {
        console.log('Données reçues:', JSON.stringify(req.body, null, 2));
        const { email, contrat, ...employeData } = req.body;

        // Générer un matricule unique
        const annee = new Date().getFullYear();
        const count = await Employe.countDocuments();
        employeData.matricule = `EMP${annee}${(count + 1).toString().padStart(4, '0')}`;

        console.log('Employe data:', JSON.stringify(employeData, null, 2));
        console.log('Contrat data:', JSON.stringify(contrat, null, 2));

        // Créer l'employé
        const employe = await Employe.create(employeData);

        // Si un email est fourni, créer un utilisateur associé
        if (email) {
            const role = await Role.findOne({ nomRole: 'Employé' });
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('temporaire123', salt);

            const utilisateur = await Utilisateur.create({
                email,
                motDePasse: hashedPassword,
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

        // Créer le contrat associé
        let contratData = null;
        if (contrat) {
            contratData = {
                ...contrat,
                employe: employe._id,
                statut: 'Actif'
            };
            const nouveauContrat = await Contrat.create(contratData);
            contratData = nouveauContrat;
        }

        res.status(201).json({
            success: true,
            data: {
                employe,
                contrat: contratData
            }
        });
    } catch (error) {
        console.error('Erreur détaillée:', error);
        console.error('Message:', error.message);
        console.error('Errors:', error.errors);
        res.status(400).json({
            success: false,
            message: error.message,
            errors: error.errors
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

        // Supprimer l'utilisateur associé
        if (employe.utilisateur) {
            await Utilisateur.findByIdAndDelete(employe.utilisateur);
        }

        await Employe.findByIdAndDelete(req.params.id);

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

// @desc    Mettre à jour le modèle de paie d'un employé
// @route   PUT /api/employes/:id/payroll-template
// @access  Private (Admin, Manager RH)
exports.updatePayrollTemplate = async (req, res) => {
    try {
        const employe = await Employe.findById(req.params.id);

        if (!employe) {
            return res.status(404).json({
                success: false,
                message: 'Employé non trouvé'
            });
        }

        employe.payrollTemplate = req.body.payrollTemplate;
        await employe.save();

        res.status(200).json({
            success: true,
            message: 'Modèle de paie mis à jour avec succès',
            data: employe
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erreur lors de la mise à jour du modèle de paie',
            error: error.message
        });
    }
};

// @desc    Obtenir le modèle de paie d'un employé
// @route   GET /api/employes/:id/payroll-template
// @access  Private (Admin, Manager RH)
exports.getPayrollTemplate = async (req, res) => {
    try {
        const employe = await Employe.findById(req.params.id);

        if (!employe) {
            return res.status(404).json({
                success: false,
                message: 'Employé non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: employe.payrollTemplate || {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du modèle de paie',
            error: error.message
        });
    }
};
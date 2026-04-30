// backend/controllers/authController.js
const Utilisateur = require('../models/Utilisateur');
const Role = require('../models/Role'); // Cette ligne était manquante
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Presence = require('../models/Presence');

// Générer un token JWT
const genererToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// @desc    Inscription
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { email, motDePasse, role } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const utilisateurExiste = await Utilisateur.findOne({ email });
        if (utilisateurExiste) {
            return res.status(400).json({
                success: false,
                message: 'Cet email est déjà utilisé'
            });
        }

        // Trouver le rôle (par défaut "Employé")
        let roleDoc = await Role.findOne({ nomRole: role || 'Employé' });
        if (!roleDoc) {
            roleDoc = await Role.findOne({ nomRole: 'Employé' });
        }

        // Hash le mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(motDePasse, salt);

        // Créer l'utilisateur
        const utilisateur = await Utilisateur.create({
            email,
            motDePasse: hashedPassword,
            role: roleDoc._id
        });

        // Générer le token
        const token = genererToken(utilisateur._id);

        res.status(201).json({
            success: true,
            token,
            utilisateur: {
                id: utilisateur._id,
                email: utilisateur.email,
                role: roleDoc.nomRole
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Connexion
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, motDePasse } = req.body;

        // Validation
        if (!email || !motDePasse) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir email et mot de passe'
            });
        }

        // Trouver l'utilisateur
        const utilisateur = await Utilisateur.findOne({ email }).populate('role').populate('employe');
        
        if (!utilisateur) {
            return res.status(401).json({
                success: false,
                message: 'Cet email n\'existe pas'
            });
        }

        // Vérifier si l'utilisateur est actif
        if (!utilisateur.actif) {
            return res.status(401).json({
                success: false,
                message: 'Compte désactivé'
            });
        }

        // Vérifier le mot de passe
        const estValide = await utilisateur.comparerMotDePasse(motDePasse);
        
        if (!estValide) {
            return res.status(401).json({
                success: false,
                message: 'Mot de passe incorrect'
            });
        }

        // Enregistrer la connexion
        await utilisateur.seConnecter();

        // Générer le token
        const token = genererToken(utilisateur._id);

        res.status(200).json({
            success: true,
            token,
            utilisateur: {
                id: utilisateur._id,
                email: utilisateur.email,
                role: utilisateur.role.nomRole,
                employe: utilisateur.employe
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Déconnexion
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    try {
        await req.utilisateur.seDeconnecter();
        
        res.status(200).json({
            success: true,
            message: 'Déconnexion réussie'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtenir mon profil
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const utilisateur = await Utilisateur.findById(req.utilisateur.id)
            .populate('role')
            .populate('employe');

        res.status(200).json({
            success: true,
            data: utilisateur
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Supprimer un utilisateur (Admin seulement)
// @route   DELETE /api/auth/users/:email
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
    try {
        const email = req.params.email;

        // Trouver l'utilisateur
        const utilisateur = await Utilisateur.findOne({ email });
        if (!utilisateur) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Supprimer l'utilisateur
        await Utilisateur.findByIdAndDelete(utilisateur._id);

        res.status(200).json({
            success: true,
            message: 'Utilisateur supprimé avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
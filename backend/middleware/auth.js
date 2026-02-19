// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/Utilisateur');

// Protéger les routes
exports.protect = async (req, res, next) => {
    let token;

    // Vérifier le token dans les headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Accès non autorisé' 
        });
    }

    try {
        // Vérifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Ajouter l'utilisateur à la requête
        req.utilisateur = await Utilisateur.findById(decoded.id).populate('role');
        
        if (!req.utilisateur) {
            return res.status(401).json({ 
                success: false, 
                message: 'Utilisateur non trouvé' 
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token invalide' 
        });
    }
};

// Vérifier les rôles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.utilisateur) {
            return res.status(401).json({ 
                success: false, 
                message: 'Non autorisé' 
            });
        }

        // Vérifier si l'utilisateur a le bon rôle
        const userRole = req.utilisateur.role.nomRole;
        
        if (!roles.includes(userRole)) {
            return res.status(403).json({ 
                success: false, 
                message: `Rôle ${userRole} non autorisé` 
            });
        }

        next();
    };
};
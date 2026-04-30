// backend/models/Utilisateur.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const utilisateurSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'L\'email est requis'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
    },
    motDePasse: {
        type: String,
        required: [true, 'Le mot de passe est requis'],
        minlength: [6, 'Le mot de passe doit avoir au moins 6 caractères']
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },
    employe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employe'
    },
    actif: {
        type: Boolean,
        default: true
    },
    derniereConnexion: {
        type: Date
    }
}, {
    timestamps: true
});

// Méthode pour comparer les mots de passe
utilisateurSchema.methods.comparerMotDePasse = async function(motDePasse) {
    return await bcrypt.compare(motDePasse, this.motDePasse);
};

// Méthodes d'authentification
utilisateurSchema.methods.seConnecter = function() {
    this.derniereConnexion = new Date();
    return this.save();
};

utilisateurSchema.methods.seDeconnecter = function() {
    return true;
};

module.exports = mongoose.model('Utilisateur', utilisateurSchema);
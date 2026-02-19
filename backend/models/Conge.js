// backend/models/Conge.js
const mongoose = require('mongoose');

const congeSchema = new mongoose.Schema({
    employe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employe',
        required: true
    },
    dateDebut: {
        type: Date,
        required: [true, 'La date de début est requise']
    },
    dateFin: {
        type: Date,
        required: [true, 'La date de fin est requise']
    },
    type: {
        type: String,
        enum: ['Congé payé', 'Congé maladie', 'Congé maternité', 'Congé sans solde'],
        required: true
    },
    statut: {
        type: String,
        enum: ['En attente', 'Approuvé', 'Refusé', 'Annulé'],
        default: 'En attente'
    },
    motif: {
        type: String,
        required: true
    },
    joursDemandes: {
        type: Number,
        required: true
    },
    approuvePar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur'
    },
    dateApprobation: Date,
    commentaire: String
}, {
    timestamps: true
});

// Validation: dateFin >= dateDebut
congeSchema.pre('save', function(next) {
    if (this.dateFin < this.dateDebut) {
        return next(new Error('La date de fin doit être postérieure à la date de début'));
    }
    
    // Calculer le nombre de jours
    const diffTime = Math.abs(this.dateFin - this.dateDebut);
    this.joursDemandes = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    next();
});

// Méthodes
congeSchema.methods.approuver = async function(utilisateurId) {
    this.statut = 'Approuvé';
    this.approuvePar = utilisateurId;
    this.dateApprobation = new Date();
    return this.save();
};

congeSchema.methods.refuser = async function(utilisateurId, raison) {
    this.statut = 'Refusé';
    this.approuvePar = utilisateurId;
    this.commentaire = raison;
    return this.save();
};

module.exports = mongoose.model('Conge', congeSchema);
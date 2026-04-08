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
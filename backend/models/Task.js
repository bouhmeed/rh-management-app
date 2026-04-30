const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    titre: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    employeAssigne: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employe',
        required: true
    },
    categorie: {
        type: String,
        trim: true
    },
    priorite: {
        type: String,
        enum: ['Haute', 'Moyenne', 'Basse'],
        default: 'Moyenne'
    },
    statut: {
        type: String,
        enum: ['En attente', 'En cours', 'Terminé', 'Annulé'],
        default: 'En attente'
    },
    dateDebut: {
        type: Date,
        default: null
    },
    dateFin: {
        type: Date,
        default: null
    },
    heureDebut: {
        type: String,
        default: '08:00'
    },
    heureFin: {
        type: String,
        default: '09:00'
    },
    dureeEstimee: {
        type: Number,
        default: 8,
        min: 0
    },
    couleur: {
        type: String,
        trim: true
    },
    progression: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    createur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur'
    },
    dateCreation: {
        type: Date,
        default: Date.now
    },
    dateModification: {
        type: Date,
        default: Date.now
    }
});

// Indexes pour améliorer les performances
taskSchema.index({ employeAssigne: 1 });
taskSchema.index({ statut: 1 });
taskSchema.index({ createur: 1 });
taskSchema.index({ employeAssigne: 1, statut: 1 });

taskSchema.pre('save', async function() {
    this.dateModification = Date.now();
});

module.exports = mongoose.model('Task', taskSchema);

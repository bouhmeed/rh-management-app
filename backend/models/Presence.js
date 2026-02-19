// backend/models/Presence.js
const mongoose = require('mongoose');

const presenceSchema = new mongoose.Schema({
    employe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employe',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    heureEntree: {
        type: String,
        required: true,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format heure invalide (HH:MM)']
    },
    heureSortie: {
        type: String,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format heure invalide (HH:MM)']
    },
    statut: {
        type: String,
        enum: ['Présent', 'Absent', 'Retard', 'Départ anticipé', 'Congé'],
        default: 'Présent'
    },
    heuresTravaillees: {
        type: Number,
        default: 0
    },
    note: String
}, {
    timestamps: true
});

// Index composé unique pour éviter les doublons par employé/date
presenceSchema.index({ employe: 1, date: 1 }, { unique: true });

// Méthodes
presenceSchema.methods.enregistrerEntree = function() {
    const now = new Date();
    this.heureEntree = now.toTimeString().split(' ')[0].substring(0, 5);
    this.date = now;
    return this.save();
};

presenceSchema.methods.enregistrerSortie = function() {
    const now = new Date();
    this.heureSortie = now.toTimeString().split(' ')[0].substring(0, 5);
    
    // Calculer les heures travaillées
    if (this.heureEntree && this.heureSortie) {
        const [h1, m1] = this.heureEntree.split(':').map(Number);
        const [h2, m2] = this.heureSortie.split(':').map(Number);
        
        const minutes1 = h1 * 60 + m1;
        const minutes2 = h2 * 60 + m2;
        
        this.heuresTravaillees = Number(((minutes2 - minutes1) / 60).toFixed(2));
    }
    
    return this.save();
};

module.exports = mongoose.model('Presence', presenceSchema);
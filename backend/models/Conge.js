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

// Indexes for performance
congeSchema.index({ employe: 1 });
congeSchema.index({ statut: 1 });
congeSchema.index({ employe: 1, statut: 1 });
congeSchema.index({ dateDebut: 1, dateFin: 1 });
congeSchema.index({ employe: 1, dateDebut: 1, dateFin: 1 });

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

// Static method to calculate leave days for payroll
congeSchema.statics.calculateLeaveForPayroll = async function(employeId, mois) {
    // Parse the month (format: YYYY-MM)
    const [year, month] = mois.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month
    
    // Find all approved leaves that overlap with the payroll month
    const conges = await this.find({
        employe: employeId,
        statut: 'Approuvé',
        $or: [
            // Leave starts in the payroll month
            { dateDebut: { $gte: startDate, $lte: endDate } },
            // Leave ends in the payroll month
            { dateFin: { $gte: startDate, $lte: endDate } },
            // Leave spans the entire payroll month
            { dateDebut: { $lte: startDate }, dateFin: { $gte: endDate } }
        ]
    });
    
    let totalDays = 0;
    const leaveDetails = [];
    
    for (const conge of conges) {
        // Calculate overlap days
        const overlapStart = new Date(Math.max(conge.dateDebut, startDate));
        const overlapEnd = new Date(Math.min(conge.dateFin, endDate));
        
        // Calculate business days (excluding weekends)
        let businessDays = 0;
        let current = new Date(overlapStart);
        
        while (current <= overlapEnd) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
                businessDays++;
            }
            current.setDate(current.getDate() + 1);
        }
        
        totalDays += businessDays;
        leaveDetails.push({
            type: conge.type,
            dateDebut: conge.dateDebut,
            dateFin: conge.dateFin,
            jours: businessDays
        });
    }
    
    return {
        totalPris: totalDays,
        details: leaveDetails
    };
};

module.exports = mongoose.model('Conge', congeSchema);
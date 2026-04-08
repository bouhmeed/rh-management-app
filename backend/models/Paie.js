// backend/models/Paie.js
const mongoose = require('mongoose');

const paieSchema = new mongoose.Schema({
    employe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employe',
        required: true
    },
    mois: {
        type: String,
        required: true,
        match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Format mois invalide (YYYY-MM)']
    },
    montant: {
        type: Number,
        required: true,
        min: 0
    },
    salaireBase: Number,
    primes: [{
        type: String,
        montant: Number
    }],
    deductions: [{
        type: String,
        montant: Number
    }],
    heuresSupplementaires: {
        heures: Number,
        taux: Number
    },
    congesPayes: {
        pris: Number,
        restants: Number
    },
    cotisations: {
        cnss: Number,
        impot: Number,
        assurance: Number
    },
    netAvantImpots: Number,
    netAPayer: Number,
    statut: {
        type: String,
        enum: ['Brouillon', 'Validé', 'Payé'],
        default: 'Brouillon'
    },
    datePaiement: Date,
    bulletinURL: String
}, {
    timestamps: true
});

// Index composé unique
paieSchema.index({ employe: 1, mois: 1 }, { unique: true });

// Méthode pour calculer le salaire
paieSchema.methods.calculerSalaire = async function() {
    // Récupérer le contrat actif de l'employé
    const Contrat = mongoose.model('Contrat');
    const contrat = await Contrat.findOne({ 
        employe: this.employe, 
        statut: 'Actif' 
    }).sort({ dateDebut: -1 });
    
    if (contrat) {
        this.salaireBase = contrat.salaireBase;
        
        // Calculer le salaire (logique simplifiée)
        let total = this.salaireBase;
        
        // Ajouter les primes
        if (this.primes && this.primes.length > 0) {
            total += this.primes.reduce((acc, prime) => acc + prime.montant, 0);
        }
        
        // Soustraire les déductions
        if (this.deductions && this.deductions.length > 0) {
            total -= this.deductions.reduce((acc, ded) => acc + ded.montant, 0);
        }
        
        // Calculer les cotisations (exemple simplifié)
        this.cotisations = {
            cnss: total * 0.09,  // 9% CNSS
            impot: total * 0.15,  // 15% d'impôt (exemple)
            assurance: total * 0.02 // 2% assurance
        };
        
        this.netAvantImpots = total;
        this.netAPayer = total - this.cotisations.cnss - this.cotisations.impot;
    }
    
    return this;
};

module.exports = mongoose.model('Paie', paieSchema);
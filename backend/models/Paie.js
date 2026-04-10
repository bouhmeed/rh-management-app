// backend/models/Paie.js
const mongoose = require('mongoose');

const paieSchema = new mongoose.Schema({
    employe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employe',
        required: true
    },
    contrat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contrat',
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
    bulletinURL: String,
    adjustments: [{
        type: {
            type: String,
            required: true
        },
        montant: {
            type: Number,
            required: true
        },
        description: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Utilisateur'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Index composé unique
paieSchema.index({ employe: 1, mois: 1 }, { unique: true });

// Méthode pour calculer le salaire
paieSchema.methods.calculerSalaire = async function() {
    // Récupérer le contrat actif de l'employé
    const Contrat = mongoose.model('Contrat');
    const Conge = mongoose.model('Conge');
    const Employe = mongoose.model('Employe');

    const contrat = await Contrat.findById(this.contrat);
    const employe = await Employe.findById(this.employe);

    if (contrat) {
        const salaireBase = contrat.salaireBase;

        // Calculer le salaire (logique simplifiée)
        let total = salaireBase;

        // Ajouter les primes
        if (this.primes && this.primes.length > 0) {
            total += this.primes.reduce((acc, prime) => acc + prime.montant, 0);
        }

        // Soustraire les déductions
        if (this.deductions && this.deductions.length > 0) {
            total -= this.deductions.reduce((acc, ded) => acc + ded.montant, 0);
        }

        // Calculer les congés pris dynamiquement
        const leaveData = await Conge.calculateLeaveForPayroll(this.employe, this.mois);
        this.congesPayes = {
            pris: leaveData.totalPris,
            restants: Math.max(0, 25 - leaveData.totalPris) // Assuming 25 days annual leave
        };

        // Apply contract template allowances if available
        if (contrat && contrat.payrollTemplate) {
            const template = contrat.payrollTemplate;

            // Transport allowance
            if (template.transportAllowance && template.transportAllowance.enabled) {
                total += template.transportAllowance.montant;
            }

            // Overtime calculation (simplified - would need presence data)
            if (template.overtimeRate && template.overtimeRate.enabled && this.heuresSupplementaires) {
                const overtimeMultiplier = template.overtimeRate.multiplier;
                const overtimeHours = this.heuresSupplementaires.heures || 0;
                const hourlyRate = salaireBase / 173.33; // Monthly hours average
                total += overtimeHours * hourlyRate * overtimeMultiplier;
            }
        }

        // Apply adjustments (one-time bonuses/deductions)
        if (this.adjustments && this.adjustments.length > 0) {
            this.adjustments.forEach(adj => {
                total += adj.montant; // Positive for bonus, negative for deduction
            });
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
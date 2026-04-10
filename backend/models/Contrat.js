// backend/models/Contrat.js
const mongoose = require('mongoose');

const contratSchema = new mongoose.Schema({
    employe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employe',
        required: true
    },
    typeContrat: {
        type: String,
        enum: ['CDI', 'CDD', 'Stage', 'Freelance', 'Intérim'],
        required: true
    },
    dateDebut: {
        type: Date,
        required: true
    },
    dateFin: {
        type: Date
    },
    salaireBase: {
        type: Number,
        required: true,
        min: 0
    },
    periodeEssai: {
        duree: Number, // en jours
        finPeriodeEssai: Date
    },
    avantages: [{
        type: String,
        enum: ['Tickets restaurant', 'Mutuelle', 'Véhicule', 'Téléphone', 'Prime']
    }],
    payrollTemplate: {
        defaultPrimes: [{
            type: {
                type: String,
                required: true
            },
            montant: {
                type: Number,
                required: true,
                min: 0
            },
            recurring: {
                type: Boolean,
                default: true
            }
        }],
        defaultDeductions: [{
            type: {
                type: String,
                required: true
            },
            montant: {
                type: Number,
                required: true,
                min: 0
            },
            recurring: {
                type: Boolean,
                default: true
            }
        }],
        transportAllowance: {
            enabled: {
                type: Boolean,
                default: false
            },
            montant: {
                type: Number,
                default: 0,
                min: 0
            }
        },
        overtimeRate: {
            enabled: {
                type: Boolean,
                default: false
            },
            multiplier: {
                type: Number,
                default: 1.5,
                min: 1
            }
        },
        mealAllowance: {
            enabled: {
                type: Boolean,
                default: false
            },
            montant: {
                type: Number,
                default: 0,
                min: 0
            }
        }
    },
    statut: {
        type: String,
        enum: ['Actif', 'Terminé', 'Résilié', 'Renouvelé'],
        default: 'Actif'
    },
    documentURL: String
}, {
    timestamps: true
});

// Validation: si CDD, dateFin requise
contratSchema.pre('save', async function() {
    if (this.typeContrat === 'CDD' && !this.dateFin) {
        throw new Error('Un contrat CDD doit avoir une date de fin');
    }
});

// Méthodes
contratSchema.methods.creerContrat = function() {
    this.statut = 'Actif';
    return this.save();
};

contratSchema.methods.resilierContrat = function(raison) {
    this.statut = 'Résilié';
    this.dateFin = new Date();
    return this.save();
};

module.exports = mongoose.model('Contrat', contratSchema);
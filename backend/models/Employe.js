// backend/models/Employe.js
const mongoose = require('mongoose');

const employeSchema = new mongoose.Schema({
       utilisateur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur'
    },
    matricule: {
        type: String,
        required: [true, 'Le matricule est requis'],
        unique: true,
        trim: true
    },
    nom: {
        type: String,
        required: [true, 'Le nom est requis'],
        trim: true
    },
    prenom: {
        type: String,
        required: [true, 'Le prénom est requis'],
        trim: true
    },
    dateEmbauche: {
        type: Date,
        required: [true, 'La date d\'embauche est requise'],
        default: Date.now
    },
    salaire: {
        type: Number,
        required: [true, 'Le salaire est requis'],
        min: [0, 'Le salaire ne peut pas être négatif']
    },
    statut: {
        type: String,
        enum: ['Actif', 'En congé', 'Suspendu', 'Démissionné'],
        default: 'Actif'
    },
    departement: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Departement',
        required: [true, 'Le département est requis']
    },
    poste: {
        type: String,
        required: true
    },
    telephone: {
        type: String,
        match: [/^[0-9+\-\s()]+$/, 'Téléphone invalide']
    },
    adresse: {
        rue: String,
        ville: String,
        codePostal: String,
        pays: { type: String, default: 'Tunisie' }
    },
    dateNaissance: Date,
    genre: {
        type: String,
        enum: ['M', 'F', 'Autre']
    },
    situationFamiliale: {
        type: String,
        enum: ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf(ve)']
    },
    enfants: {
        type: Number,
        default: 0
    },
    photo: {
        type: String,
        default: 'default-avatar.png'
    },
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
    }
}, {
    timestamps: true
});

// Méthodes
employeSchema.methods.demanderConge = async function(demandeConge) {
    // La logique sera gérée dans le modèle Conge
    return demandeConge;
};

// Index pour la recherche
employeSchema.index({ nom: 'text', prenom: 'text', matricule: 'text' });

module.exports = mongoose.model('Employe', employeSchema);
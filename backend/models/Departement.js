// backend/models/Departement.js
const mongoose = require('mongoose');

const departementSchema = new mongoose.Schema({
    nomDepartement: {
        type: String,
        required: [true, 'Le nom du département est requis'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    responsable: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employe'
    },
    employes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employe'
    }],
    actif: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Méthodes
departementSchema.methods.ajouterEmploye = async function(employeId) {
    if (!this.employes.includes(employeId)) {
        this.employes.push(employeId);
        await this.save();
    }
    return this;
};

departementSchema.methods.retirerEmploye = async function(employeId) {
    this.employes = this.employes.filter(id => id.toString() !== employeId.toString());
    await this.save();
    return this;
};

module.exports = mongoose.model('Departement', departementSchema);
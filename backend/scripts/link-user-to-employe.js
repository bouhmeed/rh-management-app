// backend/scripts/link-user-to-employe.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Utilisateur = require('../models/Utilisateur');
const Employe = require('../models/Employe');

dotenv.config();

const linkUserToEmploye = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connecté à MongoDB');

        // Find the user
        const user = await Utilisateur.findOne({ email: 'fatma.saidi@entreprise.com' });
        if (!user) {
            console.log('Utilisateur non trouvé');
            return;
        }
        console.log('Utilisateur trouvé:', user.email, 'ID:', user._id);

        // Check if user already has an employe
        if (user.employe) {
            console.log('Utilisateur déjà lié à un employé:', user.employe);
            return;
        }

        // Try to find an employe by matching email in utilisateur field or by name
        let employe = await Employe.findOne({ utilisateur: user._id });
        
        if (!employe) {
            // Try to find by name (Fatma Saidi)
            employe = await Employe.findOne({ 
                prenom: 'Fatma',
                nom: 'Saidi'
            });
        }

        if (!employe) {
            console.log('Aucun employé trouvé correspondant à cet utilisateur');
            console.log('Liste des employés disponibles:');
            const allEmployes = await Employe.find({}).populate('utilisateur', 'email');
            allEmployes.forEach(emp => {
                console.log(`- ${emp.prenom} ${emp.nom} (${emp.matricule}) - Utilisateur: ${emp.utilisateur?.email || 'Non lié'}`);
            });
            return;
        }

        // Link the user to the employe
        user.employe = employe._id;
        await user.save();
        console.log('Utilisateur lié à l\'employé:', employe.prenom, employe.nom);

        // Also link the employe to the user if not already linked
        if (!employe.utilisateur) {
            employe.utilisateur = user._id;
            await employe.save();
            console.log('Employé lié à l\'utilisateur');
        }

        console.log('Liaison réussie!');

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await mongoose.disconnect();
    }
};

linkUserToEmploye();

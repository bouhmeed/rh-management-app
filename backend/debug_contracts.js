const mongoose = require('mongoose');
require('dotenv').config();

async function debugContracts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rh_management');
        console.log('Connecté à MongoDB');
        
        const db = mongoose.connection.db;
        
        // Get models
        const Contrat = require('./models/Contrat');
        const Employe = require('./models/Employe');
        const Utilisateur = require('./models/Utilisateur');
        
        console.log('\n=== DEBUG CONTRATS ===');
        
        // 1. Check all contracts with employee population
        console.log('\n1. Tous les contrats avec employé peuplé:');
        const contrats = await Contrat.find().populate('employe', 'nom prenom email matricule');
        
        for (const contrat of contrats) {
            console.log(`\nContrat ID: ${contrat._id}`);
            console.log(`Employé ID: ${contrat.employe}`);
            console.log(`Employé peuplé: ${JSON.stringify(contrat.employe)}`);
            console.log(`Type: ${contrat.typeContrat}`);
            console.log(`Salaire: ${contrat.salaireBase}`);
            console.log(`Statut: ${contrat.statut}`);
        }
        
        // 2. Check all employees with their user
        console.log('\n\n2. Tous les employés avec utilisateur peuplé:');
        const employes = await Employe.find().populate('utilisateur', 'email role');
        
        for (const employe of employes) {
            console.log(`\nEmployé ID: ${employe._id}`);
            console.log(`Nom: ${employe.prenom} ${employe.nom}`);
            console.log(`Matricule: ${employe.matricule}`);
            console.log(`Utilisateur ID: ${employe.utilisateur}`);
            console.log(`Utilisateur peuplé: ${JSON.stringify(employe.utilisateur)}`);
        }
        
        // 3. Check users with roles
        console.log('\n\n3. Tous les utilisateurs avec rôle peuplé:');
        const utilisateurs = await Utilisateur.find().populate('role');
        
        for (const utilisateur of utilisateurs) {
            console.log(`\nUtilisateur ID: ${utilisateur._id}`);
            console.log(`Email: ${utilisateur.email}`);
            console.log(`Rôle: ${utilisateur.role}`);
            console.log(`Actif: ${utilisateur.actif}`);
        }
        
        // 4. Test the specific query from getMyContract
        console.log('\n\n4. Test de la requête getMyContract:');
        
        // Find a user with employee role
        const employeeUser = await Utilisateur.findOne({}).populate('role');
        if (employeeUser) {
            console.log(`\nTest avec utilisateur: ${employeeUser.email}`);
            console.log(`User ID: ${employeeUser._id}`);
            console.log(`User ID type: ${typeof employeeUser._id}`);
            
            // Test the original query (without ObjectId conversion)
            const employeOriginal = await Employe.findOne({ utilisateur: employeeUser._id });
            console.log(`\nRequête originale (sans ObjectId): ${employeOriginal ? 'TROUVÉ' : 'NON TROUVÉ'}`);
            
            // Test the fixed query (with ObjectId conversion)
            const employeFixed = await Employe.findOne({ utilisateur: new mongoose.Types.ObjectId(employeeUser._id) });
            console.log(`Requête fixée (avec ObjectId): ${employeFixed ? 'TROUVÉ' : 'NON TROUVÉ'}`);
            
            if (employeFixed) {
                const contrat = await Contrat.findOne({ employe: employeFixed._id }).populate('employe', 'nom prenom email matricule');
                console.log(`Contrat trouvé: ${contrat ? 'OUI' : 'NON'}`);
                if (contrat) {
                    console.log(`Détails du contrat:`, {
                        employe: contrat.employe,
                        typeContrat: contrat.typeContrat,
                        salaireBase: contrat.salaireBase,
                        statut: contrat.statut
                    });
                }
            }
        }
        
        await mongoose.connection.close();
        console.log('\nDebug terminé!');
        
    } catch (error) {
        console.error('Erreur:', error);
        process.exit(1);
    }
}

debugContracts();

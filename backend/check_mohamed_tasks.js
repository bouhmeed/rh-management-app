const mongoose = require('mongoose');
require('dotenv').config();

async function checkMohamedTasks() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté à MongoDB\n');

        const db = mongoose.connection.db;

        // Find Mohamed Ali's user
        const utilisateursCollection = db.collection('utilisateurs');
        const mohamedUser = await utilisateursCollection.findOne({ email: 'mohamed.ali@entreprise.com' });

        console.log('=== Utilisateur Mohamed Ali ===');
        console.log('Email:', mohamedUser.email);
        console.log('Role ID:', mohamedUser.role);
        console.log('Employé ID:', mohamedUser.employe);
        console.log();

        // Find Mohamed Ali's employee
        const employesCollection = db.collection('employes');
        const mohamedEmploye = await employesCollection.findOne({ _id: mohamedUser.employe });

        console.log('=== Employé Mohamed Ali ===');
        console.log('_id:', mohamedEmploye._id);
        console.log('Nom:', mohamedEmploye.nom);
        console.log('Prénom:', mohamedEmploye.prenom);
        console.log('Matricule:', mohamedEmploye.matricule);
        console.log();

        // Find tasks assigned to Mohamed Ali
        const tasksCollection = db.collection('tasks');
        const mohamedTasks = await tasksCollection.find({ employeAssigne: mohamedEmploye._id }).toArray();

        console.log('=== Tâches assignées à Mohamed Ali ===');
        console.log(`Nombre de tâches: ${mohamedTasks.length}`);
        console.log();

        if (mohamedTasks.length === 0) {
            console.log('❌ Aucune tâche assignée à Mohamed Ali');
            console.log('\n=== Toutes les tâches dans la base ===');
            const allTasks = await tasksCollection.find({}).toArray();
            allTasks.forEach(task => {
                console.log(`- ${task.titre} (employeAssigne: ${task.employeAssigne})`);
            });
        } else {
            mohamedTasks.forEach((task, index) => {
                console.log(`${index + 1}. ${task.titre}`);
                console.log(`   Statut: ${task.statut}`);
                console.log(`   Priorité: ${task.priorite}`);
                console.log(`   Date début: ${task.dateDebut}`);
                console.log(`   Date fin: ${task.dateFin}`);
                console.log();
            });
        }

        await mongoose.disconnect();
        console.log('✅ Vérification terminée');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

checkMohamedTasks();

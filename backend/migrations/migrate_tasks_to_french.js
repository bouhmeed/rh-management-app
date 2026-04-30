const mongoose = require('mongoose');
require('dotenv').config();

// Migration script to convert task fields from English to French
async function migrateTasks() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté à MongoDB');

        // Get the tasks collection
        const db = mongoose.connection.db;
        const tasksCollection = db.collection('tasks');

        // Find all tasks with old field names
        const tasks = await tasksCollection.find({}).toArray();
        console.log(`📊 ${tasks.length} tâches trouvées`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const task of tasks) {
            const updates = {};
            const unsetFields = {};

            // Check if task has old English fields
            const needsMigration = 
                task.title || 
                task.employe || 
                task.quantity || 
                task.status || 
                task.priority || 
                task.startDate || 
                task.endDate || 
                task.scheduled || 
                task.createdBy || 
                task.createdAt || 
                task.updatedAt;

            if (!needsMigration) {
                skippedCount++;
                continue;
            }

            // Map English fields to French fields
            if (task.title) {
                updates.titre = task.title;
                unsetFields.title = '';
            }
            if (task.employe) {
                updates.employeAssigne = task.employe;
                unsetFields.employe = '';
            }
            if (task.quantity !== undefined) {
                updates.dureeEstimee = task.quantity;
                unsetFields.quantity = '';
            }
            if (task.status) {
                // Map status values
                const statusMap = {
                    'Open': 'En attente',
                    'In Progress': 'En cours',
                    'Completed': 'Terminé',
                    'Cancelled': 'Annulé'
                };
                updates.statut = statusMap[task.status] || task.status;
                unsetFields.status = '';
            }
            if (task.priority) {
                // Map priority values
                const priorityMap = {
                    'Low': 'Basse',
                    'Medium': 'Moyenne',
                    'High': 'Haute'
                };
                updates.priorite = priorityMap[task.priority] || task.priority;
                unsetFields.priority = '';
            }
            if (task.startDate) {
                updates.dateDebut = task.startDate;
                unsetFields.startDate = '';
            }
            if (task.endDate) {
                updates.dateFin = task.endDate;
                unsetFields.endDate = '';
            }
            if (task.createdBy) {
                updates.createur = task.createdBy;
                unsetFields.createdBy = '';
            }
            if (task.createdAt) {
                updates.dateCreation = task.createdAt;
                unsetFields.createdAt = '';
            }
            if (task.updatedAt) {
                updates.dateModification = task.updatedAt;
                unsetFields.updatedAt = '';
            }
            // Remove scheduled field as it's not in the new schema
            if (task.scheduled !== undefined) {
                unsetFields.scheduled = '';
            }

            // Update the document
            if (Object.keys(updates).length > 0) {
                await tasksCollection.updateOne(
                    { _id: task._id },
                    { 
                        $set: updates,
                        $unset: unsetFields
                    }
                );
                updatedCount++;
                console.log(`✅ Tâche mise à jour: ${task.title || task.titre || task._id}`);
            }
        }

        console.log(`\n📊 Migration terminée:`);
        console.log(`   - ${updatedCount} tâches mises à jour`);
        console.log(`   - ${skippedCount} tâches ignorées (déjà en français)`);

        // Verify the migration
        const tasksAfter = await tasksCollection.find({}).toArray();
        console.log(`\n📊 Vérification: ${tasksAfter.length} tâches totales`);

        // Show a sample task after migration
        if (tasksAfter.length > 0) {
            console.log('\n📄 Exemple de tâche après migration:');
            console.log(JSON.stringify(tasksAfter[0], null, 2));
        }

        await mongoose.disconnect();
        console.log('\n✅ Migration terminée avec succès');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

migrateTasks();

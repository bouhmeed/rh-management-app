const mongoose = require('mongoose');
require('dotenv').config();

async function extractRealData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rh_management');
        console.log('Connecté à MongoDB - Extraction des données réelles...\n');
        
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        let realDataOutput = '# DONNÉES RÉELLES DE LA BASE\n\n';
        realDataOutput += `*Extrait le: ${new Date().toLocaleString('fr-FR')}*\n`;
        realDataOutput += `*Base de données: rh_management*\n\n`;
        
        for (const collection of collections) {
            const coll = db.collection(collection.name);
            const count = await coll.countDocuments();
            
            realDataOutput += `## Collection: ${collection.name} (${count} documents)\n\n`;
            
            if (count > 0) {
                // Extraire tous les documents ou un échantillon représentatif
                const limit = count <= 10 ? count : 5; // Limiter à 5 si plus de 10 docs
                const realDocs = await coll.find({}).limit(limit).toArray();
                
                realDataOutput += `### ${count === 1 ? 'Document unique' : `Échantillon de ${limit} document${limit > 1 ? 's' : ''}`}\n\n`;
                
                realDocs.forEach((doc, index) => {
                    realDataOutput += `#### Document ${index + 1}\n`;
                    realDataOutput += '```json\n';
                    realDataOutput += JSON.stringify(doc, null, 2);
                    realDataOutput += '\n```\n\n';
                });
                
                if (count > limit) {
                    realDataOutput += `*... et ${count - limit} document${count - limit > 1 ? 's' : ''} supplémentaire${count - limit > 1 ? 's' : ''}*\n\n`;
                }
            } else {
                realDataOutput += '**Collection vide**\n\n';
            }
            
            realDataOutput += '---\n\n';
        }
        
        // Sauvegarder dans un fichier
        require('fs').writeFileSync('donnees_reelles_bd.md', realDataOutput);
        console.log('Données réelles extraites et sauvegardées dans donnees_reelles_bd.md');
        
        // Afficher un résumé
        console.log('\n=== RÉSUMÉ DES DONNÉES RÉELLES ===');
        for (const collection of collections) {
            const coll = db.collection(collection.name);
            const count = await coll.countDocuments();
            console.log(`${collection.name}: ${count} document${count > 1 ? 's' : ''}`);
        }
        
        await mongoose.connection.close();
        
    } catch (error) {
        console.error('Erreur lors de l\'extraction:', error);
    }
}

extractRealData();

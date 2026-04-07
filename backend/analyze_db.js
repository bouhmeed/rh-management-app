const mongoose = require('mongoose');
require('dotenv').config();

async function analyzeDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rh_management');
        console.log('Connecté à MongoDB');
        
        const db = mongoose.connection.db;
        
        // Lister toutes les collections
        const collections = await db.listCollections().toArray();
        console.log('\n=== COLLECTIONS TROUVÉES ===');
        console.log(`Nombre total de collections: ${collections.length}`);
        
        for (let i = 0; i < collections.length; i++) {
            const col = collections[i];
            console.log(`${i + 1}. ${col.name}`);
        }
        
        // Pour chaque collection, compter les documents
        for (const collection of collections) {
            const coll = db.collection(collection.name);
            const count = await coll.countDocuments();
            console.log(`\n--- ${collection.name.toUpperCase()} (${count} documents) ---`);
            
            if (count > 0) {
                // Afficher un exemple de document
                const sample = await coll.findOne();
                console.log('Structure des champs:');
                
                const keys = Object.keys(sample);
                for (const key of keys) {
                    const value = sample[key];
                    const type = typeof value;
                    let displayValue = '';
                    
                    if (Array.isArray(value)) {
                        displayValue = 'Array[' + value.length + ']';
                    } else if (type === 'object' && value !== null) {
                        displayValue = 'Object';
                    } else if (type === 'string' && value.length > 50) {
                        displayValue = value.substring(0, 47) + '...';
                    } else {
                        displayValue = String(value);
                    }
                    
                    console.log(`  ${key}: ${type} = ${displayValue}`);
                }
            } else {
                console.log('Collection vide');
            }
        }
        
        await mongoose.connection.close();
        console.log('\nAnalyse terminée!');
        
    } catch (error) {
        console.error('Erreur:', error);
        process.exit(1);
    }
}

analyzeDatabase();

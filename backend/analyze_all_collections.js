const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
require('dotenv').config();

async function analyzeAllCollections() {
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
        
        // Analyser chaque collection en détail
        for (const collection of collections) {
            const coll = db.collection(collection.name);
            const count = await coll.countDocuments();
            
            console.log(`\n=== ${collection.name.toUpperCase()} (${count} documents) ===`);
            
            if (count > 0) {
                // Obtenir un échantillon de documents
                const samples = await coll.find({}).limit(3).toArray();
                
                // Analyser la structure
                const allFields = new Set();
                const fieldTypes = {};
                const nullCounts = {};
                const arrayFields = new Set();
                const objectFields = new Set();
                
                for (const doc of samples) {
                    for (const [key, value] of Object.entries(doc)) {
                        allFields.add(key);
                        
                        if (value === null || value === undefined) {
                            nullCounts[key] = (nullCounts[key] || 0) + 1;
                        } else if (Array.isArray(value)) {
                            arrayFields.add(key);
                            fieldTypes[key] = 'Array';
                        } else if (typeof value === 'object' && !(value instanceof Date) && !(value instanceof ObjectId)) {
                            objectFields.add(key);
                            fieldTypes[key] = 'Object';
                        } else {
                            fieldTypes[key] = value instanceof Date ? 'Date' : 
                                              value instanceof ObjectId ? 'ObjectId' : typeof value;
                        }
                    }
                }
                
                // Afficher la structure
                console.log('\n--- Structure des champs ---');
                const sortedFields = Array.from(allFields).sort();
                for (const field of sortedFields) {
                    const type = fieldTypes[field];
                    const nullCount = nullCounts[field] || 0;
                    const isArray = arrayFields.has(field);
                    const isObject = objectFields.has(field);
                    
                    console.log(`  ${field}: ${type}${isArray ? '[]' : ''}${isObject ? '{}' : ''} (null: ${nullCount}/${samples.length})`);
                }
                
                // Afficher un exemple de document
                console.log('\n--- Exemple de document ---');
                console.log(JSON.stringify(samples[0], null, 2));
                
                // Vérifier les indexes
                const indexes = await coll.indexInformation();
                console.log('\n--- Indexes ---');
                if (Array.isArray(indexes)) {
                    for (const index of indexes) {
                        console.log(`  ${index.name}: ${JSON.stringify(index.key)} (unique: ${index.unique || false})`);
                    }
                } else {
                    console.log('  Index information not available or not in expected format');
                }
                
                // Vérifier les références ObjectId
                console.log('\n--- Références potentielles (ObjectId) ---');
                for (const field of sortedFields) {
                    if (fieldTypes[field] === 'ObjectId' && field !== '_id') {
                        console.log(`  ${field}: référence vers une autre collection`);
                    }
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

analyzeAllCollections();

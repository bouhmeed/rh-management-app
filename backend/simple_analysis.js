const mongoose = require('mongoose');
require('dotenv').config();

async function simpleAnalysis() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rh_management');
        console.log('Connecté à MongoDB');
        
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        let analysis = '# Database Documentation\n\n';
        
        for (const collection of collections) {
            const coll = db.collection(collection.name);
            const count = await coll.countDocuments();
            
            analysis += `## Collection: ${collection.name} (${count} documents)\n\n`;
            
            if (count > 0) {
                const sample = await coll.findOne({});
                analysis += `**Sample Document:**\n\`\`\`json\n${JSON.stringify(sample, null, 2)}\n\`\`\`\n\n`;
                
                // Get field analysis
                const allFields = new Set();
                for (const [key, value] of Object.entries(sample)) {
                    allFields.add(key);
                }
                
                analysis += '**Fields:**\n';
                for (const field of Array.from(allFields).sort()) {
                    const value = sample[field];
                    let type = typeof value;
                    if (value === null) type = 'null';
                    else if (Array.isArray(value)) type = 'Array';
                    else if (value instanceof Date) type = 'Date';
                    else if (value instanceof mongoose.Types.ObjectId) type = 'ObjectId';
                    
                    analysis += `- ${field}: ${type}\n`;
                }
                analysis += '\n';
            } else {
                analysis += '**Status:** Empty collection\n\n';
            }
        }
        
        require('fs').writeFileSync('database_analysis.md', analysis);
        console.log('Analysis saved to database_analysis.md');
        
        await mongoose.connection.close();
    } catch (error) {
        console.error('Erreur:', error);
    }
}

simpleAnalysis();

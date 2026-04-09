// backend/migrations/remove-congespayes-from-paie.js
const mongoose = require('mongoose');
require('dotenv').config();

async function removeCongesPayesFromPaie() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔧 Connected to MongoDB');
        console.log('🔧 Removing congesPayes field from Paie collection...\n');
        
        // Use raw MongoDB operations to bypass Mongoose validation
        const db = mongoose.connection.db;
        const paiesCollection = db.collection('paies');
        
        const paies = await paiesCollection.find({}).toArray();
        console.log(`📊 Found ${paies.length} paie documents\n`);
        
        let fixedCount = 0;
        let skippedCount = 0;
        
        for (const paie of paies) {
            if (paie.congesPayes !== undefined) {
                await paiesCollection.updateOne(
                    { _id: paie._id },
                    { $unset: { congesPayes: "" } }
                );
                fixedCount++;
                console.log(`✅ Removed congesPayes from paie ${paie._id} (mois: ${paie.mois})`);
            } else {
                skippedCount++;
                console.log(`⏭️  Skipped paie ${paie._id} (no congesPayes field)`);
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('📋 Migration Summary:');
        console.log(`   ✅ Fixed: ${fixedCount} documents`);
        console.log(`   ⏭️  Skipped: ${skippedCount} documents`);
        console.log(`   📊 Total: ${paies.length} documents`);
        console.log('='.repeat(50));
        console.log('✅ Migration completed successfully');
        
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Stack:', error.stack);
        await mongoose.disconnect();
        process.exit(1);
    }
}

removeCongesPayesFromPaie();

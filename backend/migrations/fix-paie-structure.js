// backend/migrations/fix-paie-structure.js
const mongoose = require('mongoose');
require('dotenv').config();

async function fixPaieStructure() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔧 Connected to MongoDB');
        console.log('🔧 Fixing Paie collection structure...\n');
        
        // Use raw MongoDB operations to bypass Mongoose validation
        const db = mongoose.connection.db;
        const paiesCollection = db.collection('paies');
        
        const paies = await paiesCollection.find({}).toArray();
        console.log(`📊 Found ${paies.length} paie documents to fix\n`);
        
        let fixedCount = 0;
        let skippedCount = 0;
        
        for (const paie of paies) {
            let modified = false;
            const updates = {};
            
            // Convert primes from strings to objects
            if (paie.primes && paie.primes.length > 0) {
                const newPrimes = paie.primes.map(prime => {
                    if (typeof prime === 'string') {
                        const parts = prime.split(': ');
                        return {
                            type: parts[0] || 'Prime',
                            montant: parseFloat(parts[1]) || 0
                        };
                    }
                    return prime;
                });
                
                // Check if any conversion happened
                const wasString = paie.primes.some(p => typeof p === 'string');
                if (wasString) {
                    updates.primes = newPrimes;
                    modified = true;
                }
            }
            
            // Convert deductions from strings to objects
            if (paie.deductions && paie.deductions.length > 0) {
                const newDeductions = paie.deductions.map(ded => {
                    if (typeof ded === 'string') {
                        const parts = ded.split(': ');
                        return {
                            type: parts[0] || 'Déduction',
                            montant: parseFloat(parts[1]) || 0
                        };
                    }
                    return ded;
                });
                
                // Check if any conversion happened
                const wasString = paie.deductions.some(d => typeof d === 'string');
                if (wasString) {
                    updates.deductions = newDeductions;
                    modified = true;
                }
            }
            
            if (modified) {
                await paiesCollection.updateOne(
                    { _id: paie._id },
                    { $set: updates }
                );
                fixedCount++;
                console.log(`✅ Fixed paie ${paie._id} (mois: ${paie.mois})`);
            } else {
                skippedCount++;
                console.log(`⏭️  Skipped paie ${paie._id} (already correct)`);
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

fixPaieStructure();

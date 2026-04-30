// backend/migrations/verify-paie-fix.js
const mongoose = require('mongoose');
require('dotenv').config();

async function verifyPaieFix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔍 Verifying Paie collection structure...\n');
        
        const db = mongoose.connection.db;
        const paiesCollection = db.collection('paies');
        
        const paies = await paiesCollection.find({}).limit(3).toArray();
        
        console.log('📊 Sample documents after migration:\n');
        
        let allCorrect = true;
        
        for (const paie of paies) {
            console.log(`Paie ID: ${paie._id} (mois: ${paie.mois})`);
            
            // Check primes
            if (paie.primes && paie.primes.length > 0) {
                const firstPrime = paie.primes[0];
                if (typeof firstPrime === 'object' && firstPrime !== null) {
                    console.log(`  ✅ Primes structure: CORRECT`);
                    console.log(`     Sample: ${JSON.stringify(firstPrime)}`);
                } else {
                    console.log(`  ❌ Primes structure: INCORRECT (still string)`);
                    console.log(`     Value: ${firstPrime}`);
                    allCorrect = false;
                }
            }
            
            // Check deductions
            if (paie.deductions && paie.deductions.length > 0) {
                const firstDeduction = paie.deductions[0];
                if (typeof firstDeduction === 'object' && firstDeduction !== null) {
                    console.log(`  ✅ Deductions structure: CORRECT`);
                    console.log(`     Sample: ${JSON.stringify(firstDeduction)}`);
                } else {
                    console.log(`  ❌ Deductions structure: INCORRECT (still string)`);
                    console.log(`     Value: ${firstDeduction}`);
                    allCorrect = false;
                }
            }
            
            console.log('');
        }
        
        if (allCorrect) {
            console.log('✅ Verification PASSED: All paie documents have correct structure');
        } else {
            console.log('❌ Verification FAILED: Some documents still have incorrect structure');
        }
        
        await mongoose.disconnect();
        process.exit(allCorrect ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

verifyPaieFix();

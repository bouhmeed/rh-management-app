// backend/migrations/verify-department-employees.js
const mongoose = require('mongoose');
require('dotenv').config();

async function verifyDepartmentEmployees() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔍 Verifying department employee arrays...\n');
        
        const db = mongoose.connection.db;
        const departementsCollection = db.collection('departements');
        const employesCollection = db.collection('employes');
        
        const departements = await departementsCollection.find({}).toArray();
        
        console.log('📊 Department employee status:\n');
        
        let allCorrect = true;
        
        for (const dept of departements) {
            const employeeCount = dept.employes ? dept.employes.length : 0;
            
            // Verify the count matches actual employees
            const actualEmployees = await employesCollection.countDocuments({ 
                departement: dept._id 
            });
            
            const isCorrect = employeeCount === actualEmployees;
            
            if (isCorrect) {
                console.log(`✅ "${dept.nomDepartement}": ${employeeCount} employees (correct)`);
            } else {
                console.log(`❌ "${dept.nomDepartement}": ${employeeCount} in array, ${actualEmployees} actual (mismatch)`);
                allCorrect = false;
            }
        }
        
        console.log('\n' + '='.repeat(50));
        if (allCorrect) {
            console.log('✅ Verification PASSED: All department employee arrays are correct');
        } else {
            console.log('❌ Verification FAILED: Some departments have incorrect employee counts');
        }
        console.log('='.repeat(50));
        
        await mongoose.disconnect();
        process.exit(allCorrect ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

verifyDepartmentEmployees();

// backend/migrations/populate-department-employees.js
const mongoose = require('mongoose');
require('dotenv').config();

async function populateDepartmentEmployees() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔧 Connected to MongoDB');
        console.log('🔧 Populating department employee arrays...\n');
        
        // Use raw MongoDB operations to bypass Mongoose validation
        const db = mongoose.connection.db;
        const departementsCollection = db.collection('departements');
        const employesCollection = db.collection('employes');
        
        const departements = await departementsCollection.find({}).toArray();
        console.log(`📊 Found ${departements.length} departments\n`);
        
        let totalEmployeesAdded = 0;
        
        for (const dept of departements) {
            // Find all employees in this department
            const employees = await employesCollection.find({ departement: dept._id }).toArray();
            
            if (employees.length > 0) {
                const employeeIds = employees.map(emp => emp._id);
                
                await departementsCollection.updateOne(
                    { _id: dept._id },
                    { $set: { employes: employeeIds } }
                );
                
                totalEmployeesAdded += employees.length;
                console.log(`✅ Added ${employees.length} employees to "${dept.nomDepartement}"`);
            } else {
                console.log(`⏭️  No employees found in "${dept.nomDepartement}"`);
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('📋 Migration Summary:');
        console.log(`   ✅ Total employees added: ${totalEmployeesAdded}`);
        console.log(`   📊 Total departments: ${departements.length}`);
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

populateDepartmentEmployees();

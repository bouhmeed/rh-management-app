// backend/test_employee_contract.js - Test employee contract mapping
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Contrat = require('./models/Contrat');
const Employe = require('./models/Employe');
const Utilisateur = require('./models/Utilisateur');
const Role = require('./models/Role');

async function testEmployeeContractMapping() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Check all users
        const utilisateurs = await Utilisateur.find().populate('role');
        console.log(`📊 Found ${utilisateurs.length} utilisateurs:`);
        utilisateurs.forEach(user => {
            console.log(`   - ${user.email} (${user.role?.nomRole})`);
        });

        // 2. Check all employees
        const employes = await Employe.find();
        console.log(`\n👥 Found ${employes.length} employees:`);
        employes.forEach(emp => {
            console.log(`   - ${emp.prenom} ${emp.nom} (${emp.matricule}) -> User ID: ${emp.utilisateur}`);
        });

        // 3. Check all contracts
        const contrats = await Contrat.find().populate('employe', 'nom prenom matricule');
        console.log(`\n📋 Found ${contrats.length} contracts:`);
        contrats.forEach(contrat => {
            console.log(`   - Contract for ${contrat.employe?.prenom} ${contrat.employe?.nom} (${contrat.typeContrat})`);
        });

        // 4. Test the mapping: User -> Employee -> Contract
        console.log('\n🔍 Testing User->Employee->Contract mapping:');
        
        for (const utilisateur of utilisateurs) {
            console.log(`\n👤 Testing user: ${utilisateur.email}`);
            
            // Find employee for this user
            const employe = await Employe.findOne({ utilisateur: utilisateur._id });
            
            if (!employe) {
                console.log(`   ❌ No employee found for user ${utilisateur.email}`);
                continue;
            }
            
            console.log(`   ✅ Found employee: ${employe.prenom} ${employe.nom}`);
            
            // Find contract for this employee
            const contrat = await Contrat.findOne({ employe: employe._id })
                .populate('employe', 'nom prenom email matricule');
            
            if (!contrat) {
                console.log(`   ❌ No contract found for employee ${employe.prenom} ${employe.nom}`);
            } else {
                console.log(`   ✅ Found contract: ${contrat.typeContrat} - ${contrat.salaireBase}TND`);
            }
        }

        // 5. Test specific employee contract lookup
        console.log('\n🎯 Testing specific employee lookup:');
        
        // Get first user
        const testUser = utilisateurs[0];
        if (testUser) {
            console.log(`Testing for user: ${testUser.email}`);
            
            // Simulate the getMyContract logic
            const employeForUser = await Employe.findOne({ utilisateur: testUser._id });
            
            if (employeForUser) {
                const contratForEmployee = await Contrat.findOne({ employe: employeForUser._id })
                    .populate('employe', 'nom prenom email matricule');
                
                if (contratForEmployee) {
                    console.log('✅ SUCCESS: Employee contract mapping works!');
                    console.log(`   Employee: ${contratForEmployee.employe.prenom} ${contratForEmployee.employe.nom}`);
                    console.log(`   Contract: ${contratForEmployee.typeContrat}`);
                    console.log(`   Salary: ${contratForEmployee.salaireBase}TND`);
                } else {
                    console.log('❌ No contract found for employee');
                }
            } else {
                console.log('❌ No employee found for user');
            }
        }

        console.log('\n🎉 Employee-Contract mapping test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the test
testEmployeeContractMapping();

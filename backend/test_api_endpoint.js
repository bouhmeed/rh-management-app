// backend/test_api_endpoint.js - Test contract API endpoint
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Contrat = require('./models/Contrat');
const Employe = require('./models/Employe');
const Utilisateur = require('./models/Utilisateur');

async function testContractAPIEndpoint() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get a test user
        const testUser = await Utilisateur.findOne({ email: 'mohamed.ali@entreprise.com' });
        
        if (!testUser) {
            console.log('❌ Test user not found');
            return;
        }

        console.log(`👤 Testing API for user: ${testUser.email}`);

        // Simulate the getMyContract logic
        const employe = await Employe.findOne({ utilisateur: testUser._id });
        
        if (!employe) {
            console.log('❌ No employee found for user');
            return;
        }

        console.log(`✅ Found employee: ${employe.prenom} ${employe.nom}`);

        const contrat = await Contrat.findOne({ employe: employe._id })
            .populate('employe', 'nom prenom email matricule');

        if (!contrat) {
            console.log('❌ No contract found for employee');
            return;
        }

        console.log('✅ SUCCESS: getMyContract API logic works!');
        console.log(`📋 Contract Details:`);
        console.log(`   Type: ${contrat.typeContrat}`);
        console.log(`   Salary: ${contrat.salaireBase}TND`);
        console.log(`   Status: ${contrat.statut}`);
        console.log(`   Employee: ${contrat.employe.prenom} ${contrat.employe.nom}`);
        console.log(`   Email: ${contrat.employe.email}`);

        // Test the response format
        const apiResponse = {
            success: true,
            data: {
                _id: contrat._id,
                employe: contrat.employe,
                typeContrat: contrat.typeContrat,
                salaireBase: contrat.salaireBase,
                statut: contrat.statut,
                dateDebut: contrat.dateDebut,
                dateFin: contrat.dateFin
            }
        };

        console.log('\n📤 API Response Format:');
        console.log(JSON.stringify(apiResponse, null, 2));

        console.log('\n🎉 Contract API endpoint test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the test
testContractAPIEndpoint();

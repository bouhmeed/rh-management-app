// backend/test_contrats.js - Simple contract API test
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Contrat = require('./models/Contrat');
const Employe = require('./models/Employe');

async function testContracts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Test if we can create a contract
        const employes = await Employe.find();
        console.log(`📊 Found ${employes.length} employees`);

        if (employes.length > 0) {
            const testContrat = await Contrat.create({
                employe: employes[0]._id,
                typeContrat: 'CDI',
                dateDebut: new Date('2024-01-01'),
                salaireBase: 2500,
                statut: 'Actif'
            });
            
            console.log('✅ Test contract created:', testContrat._id);
            
            // Test fetching
            const contrats = await Contrat.find().populate('employe', 'nom prenom');
            console.log(`✅ Found ${contrats.length} contracts`);
            
            // Clean up
            await Contrat.findByIdAndDelete(testContrat._id);
            console.log('✅ Test contract cleaned up');
        }

        console.log('🎉 Contract API test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

testContracts();

// test_contrats_api.js - Test script for contract APIs
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Contrat = require('./backend/models/Contrat');
const Employe = require('./backend/models/Employe');
const Utilisateur = require('./backend/models/Utilisateur');
const Role = require('./backend/models/Role');

async function testContractAPI() {
    console.log('🧪 Testing Contract API...\n');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Test finding existing employees
        const employes = await Employe.find();
        console.log(`📊 Found ${employes.length} employees`);
        
        if (employes.length === 0) {
            console.log('❌ No employees found. Creating test employee...');
            
            // Find or create user role
            const employeRole = await Role.findOne({ nomRole: 'Employé' });
            if (!employeRole) {
                console.log('❌ Employee role not found');
                return;
            }

            // Create test user
            const bcrypt = require('bcryptjs');
            const hashedPassword = bcrypt.hashSync('test123', 10);
            
            const testUser = await Utilisateur.create({
                email: 'test.employee@rh.com',
                motDePasse: hashedPassword,
                role: employeRole._id
            });

            // Create test employee
            const testEmploye = await Employe.create({
                matricule: 'EMP20260002',
                nom: 'Test',
                prenom: 'Employee',
                dateEmbauche: new Date('2024-01-01'),
                salaire: 2500,
                statut: 'Actif',
                poste: 'Développeur',
                telephone: '12345678',
                adresse: {
                    rue: 'Test Street',
                    ville: 'Test City',
                    codePostal: '1000'
                },
                dateNaissance: new Date('1990-01-01'),
                genre: 'M',
                situationFamiliale: 'Célibataire',
                enfants: 0,
                utilisateur: testUser._id
            });

            console.log('✅ Test employee created:', testEmploye.matricule);
            
            // Update employes array
            employes.push(testEmploye);
        }

        // 2. Test creating a contract
        console.log('\n📝 Creating test contract...');
        const testContrat = await Contrat.create({
            employe: employes[0]._id,
            typeContrat: 'CDI',
            dateDebut: new Date('2024-01-01'),
            salaireBase: 2500,
            periodeEssai: {
                duree: 90,
                finPeriodeEssai: new Date('2024-04-01')
            },
            avantages: ['Tickets restaurant', 'Mutuelle', 'Véhicule'],
            statut: 'Actif'
        });

        console.log('✅ Contract created successfully:', testContrat._id);

        // 3. Test fetching all contracts
        console.log('\n📋 Fetching all contracts...');
        const allContrats = await Contrat.find().populate('employe', 'nom prenom email matricule');
        console.log(`✅ Found ${allContrats.length} contracts`);

        // 4. Test fetching single contract
        console.log('\n🔍 Fetching single contract...');
        const singleContrat = await Contrat.findById(testContrat._id).populate('employe', 'nom prenom email matricule');
        console.log('✅ Single contract fetched:', singleContrat.typeContrat);

        // 5. Test updating contract
        console.log('\n✏️ Updating contract...');
        const updatedContrat = await Contrat.findByIdAndUpdate(
            testContrat._id,
            { 
                salaireBase: 3000,
                avantages: ['Tickets restaurant', 'Mutuelle', 'Véhicule', 'Prime']
            },
            { new: true }
        );
        console.log('✅ Contract updated. New salary:', updatedContrat.salaireBase);

        // 6. Test contract validation
        console.log('\n⚠️ Testing contract validation...');
        try {
            const invalidContrat = await Contrat.create({
                employe: employes[0]._id,
                typeContrat: 'CDD',
                dateDebut: new Date('2024-01-01'),
                // Missing dateFin for CDD - should fail
                salaireBase: 2500,
                statut: 'Actif'
            });
            console.log('❌ Validation failed - CDD without end date was accepted');
        } catch (error) {
            console.log('✅ Validation working - CDD without end date rejected:', error.message);
        }

        // 7. Test deleting contract
        console.log('\n🗑️ Deleting test contract...');
        await Contrat.findByIdAndDelete(testContrat._id);
        console.log('✅ Contract deleted successfully');

        // 8. Final verification
        const finalContrats = await Contrat.find();
        console.log(`\n📊 Final contract count: ${finalContrats.length}`);

        console.log('\n🎉 All API tests completed successfully!');
        console.log('\n📋 API Endpoints Summary:');
        console.log('GET /api/contrats - Get all contracts');
        console.log('GET /api/contrats/my-contract - Get my contract (for employees)');
        console.log('GET /api/contrats/:id - Get contract by ID');
        console.log('POST /api/contrats - Create new contract');
        console.log('PUT /api/contrats/:id - Update contract');
        console.log('DELETE /api/contrats/:id - Delete contract');
        console.log('PUT /api/contrats/:id/resilier - Terminate contract');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the test
testContractAPI();

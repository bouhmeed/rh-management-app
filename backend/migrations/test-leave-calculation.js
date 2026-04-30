// backend/migrations/test-leave-calculation.js
const mongoose = require('mongoose');
require('dotenv').config();
const Employe = require('../models/Employe');
const Departement = require('../models/Departement');
const Conge = require('../models/Conge');

async function testLeaveCalculation() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔍 Testing leave calculation for payroll...\n');
        
        // Get first employee
        const employee = await Employe.findOne().populate('departement');
        if (!employee) {
            console.log('❌ No employees found');
            process.exit(1);
        }
        
        console.log(`Testing for employee: ${employee.nom} ${employee.prenom}`);
        console.log(`Department: ${employee.departement?.nomDepartement || 'N/A'}\n`);
        
        // Test for April 2026
        const mois = '2026-04';
        console.log(`Calculating leave for month: ${mois}\n`);
        
        // Get employee's approved leaves
        const conges = await Conge.find({
            employe: employee._id,
            statut: 'Approuvé'
        });
        
        console.log(`Total approved leaves for employee: ${conges.length}`);
        conges.forEach(conge => {
            console.log(`  - ${conge.type}: ${conge.dateDebut.toISOString().split('T')[0]} to ${conge.dateFin.toISOString().split('T')[0]} (${conge.joursDemandes} days)`);
        });
        
        console.log('\n--- Testing calculateLeaveForPayroll ---\n');
        
        // Test the new static method
        const leaveData = await Conge.calculateLeaveForPayroll(employee._id, mois);
        
        console.log('📊 Leave Calculation Results:');
        console.log(`   Total business days taken: ${leaveData.totalPris}`);
        console.log(`   Leave details: ${leaveData.details.length} entries`);
        
        if (leaveData.details.length > 0) {
            console.log('\n   Leave Details:');
            leaveData.details.forEach((detail, index) => {
                console.log(`   ${index + 1}. ${detail.type}: ${detail.jours} business days`);
                console.log(`      (${detail.dateDebut.toISOString().split('T')[0]} to ${detail.dateFin.toISOString().split('T')[0]})`);
            });
        }
        
        console.log('\n✅ Test completed successfully');
        
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
        await mongoose.disconnect();
        process.exit(1);
    }
}

testLeaveCalculation();

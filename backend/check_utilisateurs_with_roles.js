const mongoose = require('mongoose');
require('dotenv').config();

async function checkUtilisateursWithRoles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Get all users
    const utilisateurs = await db.collection('utilisateurs').find({}).toArray();
    
    // Get all roles for reference
    const roles = await db.collection('roles').find({}).toArray();
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role._id.toString()] = role.nomRole;
    });
    
    console.log('\n=== UTILISATEURS COLLECTION WITH ROLES ===');
    console.log(`Total users: ${utilisateurs.length}`);
    console.log(`Total roles: ${roles.length}\n`);
    
    // Display roles first
    console.log('--- Available Roles ---');
    roles.forEach((role, index) => {
      console.log(`${index + 1}. ${role.nomRole} (ID: ${role._id})`);
      console.log(`   Description: ${role.description}`);
      console.log(`   Permissions: ${role.permissions.join(', ')}`);
      console.log('');
    });
    
    // Display users with their role names
    console.log('--- Users ---');
    utilisateurs.forEach((user, index) => {
      const roleName = roleMap[user.role.toString()] || 'Unknown Role';
      console.log(`--- User ${index + 1} ---`);
      console.log(`ID: ${user._id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${roleName} (ID: ${user.role})`);
      console.log(`Actif: ${user.actif}`);
      console.log(`Dernière connexion: ${user.derniereConnexion || 'N/A'}`);
      console.log(`Created: ${user.createdAt}`);
      console.log('');
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUtilisateursWithRoles();

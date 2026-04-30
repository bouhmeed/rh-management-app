const mongoose = require('mongoose');
require('dotenv').config();

async function checkUtilisateurs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const utilisateurs = await db.collection('utilisateurs').find({}).toArray();
    
    console.log('\n=== UTILISATEURS COLLECTION ===');
    console.log(`Total documents: ${utilisateurs.length}\n`);
    
    utilisateurs.forEach((user, index) => {
      console.log(`--- User ${index + 1} ---`);
      console.log(`ID: ${user._id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Actif: ${user.actif}`);
      console.log(`Dernière connexion: ${user.derniereConnexion || 'N/A'}`);
      console.log(`Created: ${user.createdAt}`);
      console.log(`Updated: ${user.updatedAt}`);
      console.log('');
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUtilisateurs();

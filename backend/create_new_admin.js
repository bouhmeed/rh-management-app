const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createNewAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const utilisateursCollection = db.collection('utilisateurs');
    
    // Check if admin already exists
    const existingAdmin = await utilisateursCollection.findOne({ email: 'admin@rh.com' });
    if (existingAdmin) {
      console.log('Admin user already exists. Deleting old one...');
      await utilisateursCollection.deleteOne({ email: 'admin@rh.com' });
      console.log('Old admin user deleted.');
    }
    
    // Get the Admin role ID
    const adminRole = await db.collection('roles').findOne({ nomRole: 'Admin' });
    if (!adminRole) {
      console.log('Admin role not found!');
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create new admin user
    const newAdmin = {
      email: 'admin@rh.com',
      motDePasse: hashedPassword,
      role: adminRole._id,
      actif: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await utilisateursCollection.insertOne(newAdmin);
    
    console.log('\n=== ADMIN USER CREATED SUCCESSFULLY ===');
    console.log(`Email: admin@rh.com`);
    console.log(`Password: admin123`);
    console.log(`User ID: ${result.insertedId}`);
    console.log(`Role: Admin (${adminRole.nomRole})`);
    console.log(`Role ID: ${adminRole._id}`);
    console.log('\nPermissions:');
    console.log(adminRole.permissions.join(', '));
    
    // Verify creation
    const totalUsers = await utilisateursCollection.countDocuments();
    console.log(`\nTotal users in database: ${totalUsers}`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error creating admin:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createNewAdmin();

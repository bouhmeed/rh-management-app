// Test script for authentication and role-based access control
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let managerRHToken = '';
let managerToken = '';
let employeToken = '';

let managerRHUser = {};
let managerUser = {};
let employeUser = {};

// Login as admin
async function loginAdmin() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@rh.com',
            motDePasse: 'admin123'
        });
        adminToken = response.data.token;
        console.log('✅ Admin login successful');
        return adminToken;
    } catch (error) {
        console.error('❌ Admin login failed:', error.response?.data || error.message);
    }
}

// Register users with different roles
async function registerUsers() {
    // Delete existing test users first
    const testEmails = ['manager.rh@test.com', 'manager@test.com', 'employe@test.com'];
    for (const email of testEmails) {
        try {
            await axios.delete(`${BASE_URL}/auth/users/${email}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log(`🗑️ Deleted existing user: ${email}`);
        } catch (error) {
            // User might not exist, ignore
        }
    }

    const users = [
        { email: 'manager.rh@test.com', motDePasse: 'test123', role: 'Manager RH' },
        { email: 'manager@test.com', motDePasse: 'test123', role: 'Manager' },
        { email: 'employe@test.com', motDePasse: 'test123', role: 'Employé' }
    ];

    for (const user of users) {
        try {
            const response = await axios.post(`${BASE_URL}/auth/register`, user, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log(`✅ User ${user.email} registered with role ${user.role}`);

            // Store user info
            if (user.role === 'Manager RH') managerRHUser = response.data;
            else if (user.role === 'Manager') managerUser = response.data;
            else if (user.role === 'Employé') employeUser = response.data;

        } catch (error) {
            console.error(`❌ Failed to register ${user.email}:`, error.response?.status, error.response?.statusText, error.response?.data || error.message);
        }
    }
}

// Login with different roles
async function loginUsers() {
    // Login Manager RH
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'manager.rh@test.com',
            motDePasse: 'test123'
        });
        managerRHToken = response.data.token;
        console.log('✅ Manager RH login successful');
    } catch (error) {
        console.error('❌ Manager RH login failed:', error.response?.data || error.message);
    }

    // Login Manager
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'manager@test.com',
            motDePasse: 'test123'
        });
        managerToken = response.data.token;
        console.log('✅ Manager login successful');
    } catch (error) {
        console.error('❌ Manager login failed:', error.response?.data || error.message);
    }

    // Login Employé
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'employe@test.com',
            motDePasse: 'test123'
        });
        employeToken = response.data.token;
        console.log('✅ Employé login successful');
    } catch (error) {
        console.error('❌ Employé login failed:', error.response?.data || error.message);
    }
}

// Test permissions for different roles on employee operations
async function testPermissions() {
    console.log('\n🧪 Testing Role-Based Access Control...\n');

    // Test GET employees (all roles should have read access)
    const roles = [
        { name: 'Admin', token: adminToken },
        { name: 'Manager RH', token: managerRHToken },
        { name: 'Manager', token: managerToken },
        { name: 'Employé', token: employeToken }
    ];

    for (const role of roles) {
        if (!role.token) continue;

        console.log(`Testing ${role.name} permissions:`);

        // Test GET employees
        try {
            await axios.get(`${BASE_URL}/employes`, {
                headers: { Authorization: `Bearer ${role.token}` }
            });
            console.log(`  ✅ ${role.name} can READ employees`);
        } catch (error) {
            console.log(`  ❌ ${role.name} cannot READ employees: ${error.response?.status} ${error.response?.statusText}`);
        }

        // Test CREATE employee (only Admin and Manager RH)
        try {
            const deptResponse = await axios.get(`${BASE_URL}/departements`, {
                headers: { Authorization: `Bearer ${role.token}` }
            });
            if (deptResponse.data.data && deptResponse.data.data.length > 0) {
                const deptId = deptResponse.data.data[0]._id;
                await axios.post(`${BASE_URL}/employes`, {
                    nom: 'Test',
                    prenom: 'User',
                    dateEmbauche: '2024-01-01',
                    salaire: 25000,
                    poste: 'Test',
                    departement: deptId,
                    email: `test.${role.name.toLowerCase()}@test.com`
                }, {
                    headers: { Authorization: `Bearer ${role.token}` }
                });
                console.log(`  ✅ ${role.name} can CREATE employees`);
            }
        } catch (error) {
            console.log(`  ❌ ${role.name} cannot CREATE employees: ${error.response?.status} ${error.response?.statusText}`);
        }

        // Test UPDATE employee (only Admin and Manager RH)
        // Note: Would need an existing employee ID to test properly

        // Test DELETE employee (only Admin)
        // Note: Would need an existing employee ID to test properly

        console.log('');
    }
}

// Get a departement ID for testing
async function getDepartementId() {
    try {
        const response = await axios.get(`${BASE_URL}/departements`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (response.data.data && response.data.data.length > 0) {
            return response.data.data[0]._id;
        }
    } catch (error) {
        console.error('❌ Failed to get departement:', error.response?.data || error.message);
    }
    return null;
}

// Run all authentication tests
async function runAuthTests() {
    console.log('🚀 Starting Authentication & Role-Based Access Control Tests...\n');

    await loginAdmin();
    if (!adminToken) return;

    await registerUsers();
    await loginUsers();

    await testPermissions();

    console.log('\n🎉 Authentication & Role tests completed!');
}

runAuthTests();

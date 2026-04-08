// Test script for creating employee and testing employee login
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let employeeToken = '';
let createdEmployeeId = '';
let employeeEmail = '';

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

// Get a departement ID
async function getDepartementId() {
    try {
        const response = await axios.get(`${BASE_URL}/departements`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`Found ${response.data.data.length} departements`);
        if (response.data.data && response.data.data.length > 0) {
            console.log('Using departement:', response.data.data[0].nomDepartement);
            return response.data.data[0]._id;
        }
        console.log('No departements found, need to create one first');
    } catch (error) {
        console.error('❌ Failed to get departement:', error.response?.data || error.message);
    }
    return null;
}

// Create an employee with email (this also creates a user account)
async function createEmployee(departementId) {
    const timestamp = Date.now();
    const uniqueEmail = `john.test.${timestamp}@test.com`;
    
    try {
        const employeeData = {
            nom: 'TestEmployee',
            prenom: 'John',
            dateEmbauche: '2024-03-04',
            salaire: 25000,
            poste: 'Développeur Junior',
            departement: departementId,
            email: uniqueEmail,
            telephone: '0123456789',
            genre: 'M',
            situationFamiliale: 'Célibataire'
        };

        const response = await axios.post(`${BASE_URL}/employes`, employeeData, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        createdEmployeeId = response.data.data._id;
        console.log('✅ Employee created successfully:', createdEmployeeId);
        console.log('   Email:', uniqueEmail);
        console.log('   Temp password: temporaire123');
        
        // Store the email for login
        employeeEmail = uniqueEmail;
        return response.data;
    } catch (error) {
        console.error('❌ Employee creation failed:', error.response?.status, error.response?.statusText);
        console.error('   Error details:', error.response?.data);
    }
}

// Login as the created employee
async function loginAsEmployee() {
    if (!employeeEmail) {
        console.error('❌ No employee email available for login');
        return;
    }
    
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: employeeEmail,
            motDePasse: 'temporaire123'
        });
        employeeToken = response.data.token;
        console.log('✅ Employee login successful');
        return response.data;
    } catch (error) {
        console.error('❌ Employee login failed:', error.response?.status, error.response?.statusText);
        console.error('   Error details:', error.response?.data);
    }
}

// Register users with different roles
async function registerUsers() {
    // Delete existing test users first
    const testEmails = ['john.test@test.com'];
    for (const email of testEmails) {
        try {
            const response = await axios.delete(`${BASE_URL}/auth/users/${email}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log(`🗑️ Deleted existing user: ${email}`);
        } catch (error) {
            console.log(`⚠️ Could not delete user ${email}:`, error.response?.status, error.response?.data?.message || error.message);
        }
    }
}

// Test employee permissions and functionality
async function testEmployeeFeatures() {
    console.log('\n🧪 Testing Employee Features...\n');

    // Test 1: Get own profile
    try {
        const response = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${employeeToken}` }
        });
        console.log('✅ Employee can get own profile');
        console.log('   Role:', response.data.data.role.nomRole);
    } catch (error) {
        console.log('❌ Employee cannot get own profile:', error.response?.status, error.response?.statusText);
    }

    // Test 2: Read employees
    try {
        const response = await axios.get(`${BASE_URL}/employes`, {
            headers: { Authorization: `Bearer ${employeeToken}` }
        });
        console.log('✅ Employee can read employees list');
    } catch (error) {
        console.log('❌ Employee cannot read employees:', error.response?.status, error.response?.statusText);
    }

    // Test 3: Try to create employee (should fail)
    try {
        const deptId = await getDepartementId();
        if (deptId) {
            await axios.post(`${BASE_URL}/employes`, {
                nom: 'Test',
                prenom: 'Fail',
                dateEmbauche: '2024-01-01',
                salaire: 20000,
                poste: 'Test',
                departement: deptId
            }, {
                headers: { Authorization: `Bearer ${employeeToken}` }
            });
            console.log('❌ Employee should not be able to create employees');
        }
    } catch (error) {
        if (error.response?.status === 403) {
            console.log('✅ Employee correctly blocked from creating employees');
        } else {
            console.log('❌ Unexpected error when employee tries to create:', error.response?.status, error.response?.statusText);
        }
    }

    // Test 4: Try to update own employee record (should fail)
    try {
        await axios.put(`${BASE_URL}/employes/${createdEmployeeId}`, {
            salaire: 30000
        }, {
            headers: { Authorization: `Bearer ${employeeToken}` }
        });
        console.log('❌ Employee should not be able to update employees');
    } catch (error) {
        if (error.response?.status === 403) {
            console.log('✅ Employee correctly blocked from updating employees');
        } else {
            console.log('❌ Unexpected error when employee tries to update:', error.response?.status, error.response?.statusText);
        }
    }

    // Test 5: Check if employee can access their own detailed info
    try {
        const response = await axios.get(`${BASE_URL}/employes/${createdEmployeeId}`, {
            headers: { Authorization: `Bearer ${employeeToken}` }
        });
        console.log('✅ Employee can read their own detailed info');
    } catch (error) {
        console.log('❌ Employee cannot read their own info:', error.response?.status, error.response?.statusText);
    }

    // Test 6: Try to delete employee (should fail)
    try {
        await axios.delete(`${BASE_URL}/employes/${createdEmployeeId}`, {
            headers: { Authorization: `Bearer ${employeeToken}` }
        });
        console.log('❌ Employee should not be able to delete employees');
    } catch (error) {
        if (error.response?.status === 403) {
            console.log('✅ Employee correctly blocked from deleting employees');
        } else {
            console.log('❌ Unexpected error when employee tries to delete:', error.response?.status, error.response?.statusText);
        }
    }
}

// Run the complete test
async function runEmployeeTest() {
    console.log('🚀 Testing Employee Creation and Login...\n');

    await loginAdmin();
    if (!adminToken) return;

    const deptId = await getDepartementId();
    if (!deptId) {
        console.error('❌ No departement found, cannot create employee');
        return;
    }

    await createEmployee(deptId);
    if (!createdEmployeeId) return;

    await loginAsEmployee();
    if (!employeeToken) return;

    await testEmployeeFeatures();

    console.log('\n🎉 Employee testing completed!');
}

runEmployeeTest();

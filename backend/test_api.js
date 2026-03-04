// Test script for employee API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let token = '';
let createdEmployeeId = '';

// Login first
async function login() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@rh.com',
            motDePasse: 'admin123'
        });
        token = response.data.token;
        console.log('✅ Login successful');
        return token;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
    }
}

// Test GET employees
async function testGetEmployees() {
    try {
        const response = await axios.get(`${BASE_URL}/employes`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ GET /api/employes successful, count:', response.data.count);
        return response.data;
    } catch (error) {
        console.error('❌ GET /api/employes failed:', error.response?.data || error.message);
    }
}

// Get a departement ID
async function getDepartementId() {
    try {
        const response = await axios.get(`${BASE_URL}/departements`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.data && response.data.data.length > 0) {
            return response.data.data[0]._id;
        }
    } catch (error) {
        console.error('❌ Failed to get departement:', error.response?.data || error.message);
    }
    return null;
}

// Test POST create employee
async function testCreateEmployee(departementId) {
    try {
        const employeeData = {
            nom: 'Dupont',
            prenom: 'Marie',
            dateEmbauche: '2024-01-15',
            salaire: 35000,
            poste: 'Manager',
            departement: departementId,
            email: 'marie.dupont@test.com',
            telephone: '0123456789',
            genre: 'F',
            situationFamiliale: 'Marié(e)'
        };
        const response = await axios.post(`${BASE_URL}/employes`, employeeData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        createdEmployeeId = response.data.data._id;
        console.log('✅ POST /api/employes successful, created employee ID:', createdEmployeeId);
        return response.data;
    } catch (error) {
        console.error('❌ POST /api/employes failed:', error.response?.data || error.message);
    }
}

// Test GET employee by ID
async function testGetEmployeeById() {
    if (!createdEmployeeId) return;
    try {
        const response = await axios.get(`${BASE_URL}/employes/${createdEmployeeId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ GET /api/employes/:id successful for employee:', response.data.data.nom, response.data.data.prenom);
        return response.data;
    } catch (error) {
        console.error('❌ GET /api/employes/:id failed:', error.response?.data || error.message);
    }
}

// Test PUT update employee
async function testUpdateEmployee() {
    if (!createdEmployeeId) return;
    try {
        const updateData = {
            salaire: 40000,
            poste: 'Senior Manager'
        };
        const response = await axios.put(`${BASE_URL}/employes/${createdEmployeeId}`, updateData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ PUT /api/employes/:id successful, updated salary to:', response.data.data.salaire);
        return response.data;
    } catch (error) {
        console.error('❌ PUT /api/employes/:id failed:', error.response?.data || error.message);
    }
}

// Test DELETE employee
async function testDeleteEmployee() {
    if (!createdEmployeeId) return;
    try {
        const response = await axios.delete(`${BASE_URL}/employes/${createdEmployeeId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ DELETE /api/employes/:id successful');
        return response.data;
    } catch (error) {
        console.error('❌ DELETE /api/employes/:id failed:', error.response?.data || error.message);
    }
}

// Run all tests
async function runTests() {
    console.log('🚀 Starting Employee API Tests...\n');

    await login();
    if (!token) return;

    await testGetEmployees();

    const departementId = await getDepartementId();
    if (!departementId) {
        console.error('❌ No departement found, cannot create employee');
        return;
    }

    await testCreateEmployee(departementId);
    await testGetEmployeeById();
    await testUpdateEmployee();
    await testDeleteEmployee();

    console.log('\n🎉 All tests completed!');
}

runTests();

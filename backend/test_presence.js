// Test script for presence API functionalities
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let employeeId = '';

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

// Get an employee ID
async function getEmployeeId() {
    try {
        const response = await axios.get(`${BASE_URL}/employes`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (response.data.data && response.data.data.length > 0) {
            employeeId = response.data.data[0]._id;
            console.log('✅ Got employee ID:', employeeId);
            return employeeId;
        }
    } catch (error) {
        console.error('❌ Failed to get employees:', error.response?.data || error.message);
    }
    return null;
}

// Test 1: Get all presences
async function testGetPresences() {
    try {
        const response = await axios.get(`${BASE_URL}/presences`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ GET /api/presences successful, count:', response.data.data?.length || 0);
        return response.data;
    } catch (error) {
        console.error('❌ GET /api/presences failed:', error.response?.data || error.message);
    }
}

// Test 2: Create presence record
async function testCreatePresence() {
    try {
        const presenceData = {
            employe: employeeId,
            date: new Date().toISOString().split('T')[0],
            statut: 'Présent',
            note: 'Test presence'
        };
        const response = await axios.post(`${BASE_URL}/presences`, presenceData, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ POST /api/presences successful, created presence ID:', response.data.data._id);
        return response.data.data._id;
    } catch (error) {
        console.error('❌ POST /api/presences failed:', error.response?.data || error.message);
    }
}

// Test 3: Check-in (enregistrerEntree)
async function testCheckIn() {
    if (!employeeId) return;
    try {
        const response = await axios.post(`${BASE_URL}/presences/entree/${employeeId}`, {}, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ POST /api/presences/entree/:employeId successful');
        return response.data;
    } catch (error) {
        console.error('❌ POST /api/presences/entree/:employeId failed:', error.response?.data || error.message);
    }
}

// Test 4: Check-out (enregistrerSortie)
async function testCheckOut() {
    if (!employeeId) return;
    try {
        const response = await axios.post(`${BASE_URL}/presences/sortie/${employeeId}`, {}, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ POST /api/presences/sortie/:employeId successful');
        return response.data;
    } catch (error) {
        console.error('❌ POST /api/presences/sortie/:employeId failed:', error.response?.data || error.message);
    }
}

// Test 5: Start work session
async function testStartWork() {
    if (!employeeId) return;
    try {
        const response = await axios.post(`${BASE_URL}/presences/start/${employeeId}`, {}, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ POST /api/presences/start/:employeId successful');
        return response.data;
    } catch (error) {
        console.error('❌ POST /api/presences/start/:employeId failed:', error.response?.data || error.message);
    }
}

// Test 6: Pause work
async function testPauseWork() {
    if (!employeeId) return;
    try {
        const response = await axios.post(`${BASE_URL}/presences/pause/${employeeId}`, {}, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ POST /api/presences/pause/:employeId successful');
        return response.data;
    } catch (error) {
        console.error('❌ POST /api/presences/pause/:employeId failed:', error.response?.data || error.message);
    }
}

// Test 7: Resume work
async function testResumeWork() {
    if (!employeeId) return;
    try {
        const response = await axios.post(`${BASE_URL}/presences/resume/${employeeId}`, {}, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ POST /api/presences/resume/:employeId successful');
        return response.data;
    } catch (error) {
        console.error('❌ POST /api/presences/resume/:employeId failed:', error.response?.data || error.message);
    }
}

// Test 8: Get current session
async function testGetCurrentSession() {
    if (!employeeId) return;
    try {
        const response = await axios.get(`${BASE_URL}/presences/current/${employeeId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (response.data.data) {
            console.log('✅ GET /api/presences/current/:employeId successful, status:', response.data.data.sessionStatus);
        } else {
            console.log('✅ GET /api/presences/current/:employeId successful, no active session');
        }
        return response.data;
    } catch (error) {
        console.error('❌ GET /api/presences/current/:employeId failed:', error.response?.data || error.message);
    }
}

// Test 9: End work
async function testEndWork() {
    if (!employeeId) return;
    try {
        const response = await axios.post(`${BASE_URL}/presences/end/${employeeId}`, {}, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ POST /api/presences/end/:employeId successful');
        return response.data;
    } catch (error) {
        console.error('❌ POST /api/presences/end/:employeId failed:', error.response?.data || error.message);
    }
}

// Test 10: Update presence
async function testUpdatePresence(presenceId) {
    if (!presenceId) return;
    try {
        const updateData = {
            statut: 'Retard',
            note: 'Updated test presence'
        };
        const response = await axios.put(`${BASE_URL}/presences/${presenceId}`, updateData, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ PUT /api/presences/:id successful');
        return response.data;
    } catch (error) {
        console.error('❌ PUT /api/presences/:id failed:', error.response?.data || error.message);
    }
}

// Test 11: Delete presence
async function testDeletePresence(presenceId) {
    if (!presenceId) return;
    try {
        const response = await axios.delete(`${BASE_URL}/presences/${presenceId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ DELETE /api/presences/:id successful');
        return response.data;
    } catch (error) {
        console.error('❌ DELETE /api/presences/:id failed:', error.response?.data || error.message);
    }
}

// Run all presence tests
async function runPresenceTests() {
    console.log('🚀 Testing Presence API Functionalities...\n');

    await loginAdmin();
    if (!adminToken) return;

    await getEmployeeId();
    if (!employeeId) return;

    // Test basic CRUD
    await testGetPresences();
    const presenceId = await testCreatePresence();

    // Test check-in/check-out
    await testCheckIn();
    await testCheckOut();

    // Test work session management
    await testStartWork();
    await testPauseWork();
    await testResumeWork();
    await testGetCurrentSession();
    await testEndWork();

    // Test update and delete
    if (presenceId) {
        await testUpdatePresence(presenceId);
        await testDeletePresence(presenceId);
    }

    console.log('\n🎉 Presence API testing completed!');
}

runPresenceTests();

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testPresenceUpdate() {
    try {
        // First, login to get a token
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'mohamed.ali@entreprise.com',
            motDePasse: 'employe2024'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful, token obtained');
        
        // Get a presence to update
        const presencesResponse = await axios.get(`${API_URL}/presences`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const presences = presencesResponse.data.data;
        if (presences.length === 0) {
            console.log('❌ No presences found to test update');
            return;
        }
        
        const presenceToUpdate = presences[0];
        console.log(`📝 Testing update for presence ID: ${presenceToUpdate._id}`);
        console.log('Current data:', presenceToUpdate);
        
        // Update the presence
        const updateData = {
            checkIn: new Date('2026-04-10T10:00:00.000Z'),
            checkOut: new Date('2026-04-10T12:00:00.000Z'),
            hoursWorked: 2,
            status: 'Present'
        };
        
        const updateResponse = await axios.put(
            `${API_URL}/presences/${presenceToUpdate._id}`,
            updateData,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('✅ Update successful!');
        console.log('Updated presence:', updateResponse.data.data);
        
    } catch (error) {
        console.error('❌ Error testing presence update:', error.response?.data || error.message);
    }
}

testPresenceUpdate();

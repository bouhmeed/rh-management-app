const axios = require('axios');
const mongoose = require('mongoose');

const API_BASE = 'http://localhost:5000/api';

async function testTasksAPI() {
    let authToken = null;

    console.log('=== Test de l\'API des Tâches ===\n');

    try {
        // 1. Login as admin to get token
        console.log('1. Connexion en tant qu\'admin...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@rh.com',
            motDePasse: 'admin123'
        });

        authToken = loginResponse.data.token;
        console.log('✅ Connexion réussie\n');

        // 2. Test GET all tasks
        console.log('2. Récupération de toutes les tâches...');
        let tasksResponse = null;
        try {
            tasksResponse = await axios.get(`${API_BASE}/tasks`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            console.log(`✅ ${tasksResponse.data.data.length} tâches trouvées`);
            if (tasksResponse.data.data.length > 0) {
                console.log('   Exemple de tâche:', JSON.stringify(tasksResponse.data.data[0], null, 2));
            }
        } catch (error) {
            console.log('❌ Erreur lors de la récupération des tâches:', error.response?.data || error.message);
        }
        console.log();

        // 3. Test GET single task
        if (tasksResponse && tasksResponse.data.data.length > 0) {
            const taskId = tasksResponse.data.data[0]._id;
            console.log('3. Récupération d\'une tâche spécifique...');
            try {
                const taskResponse = await axios.get(`${API_BASE}/tasks/${taskId}`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                console.log('✅ Tâche récupérée:', taskResponse.data.data.titre);
            } catch (error) {
                console.log('❌ Erreur lors de la récupération de la tâche:', error.response?.data || error.message);
            }
            console.log();
        }

        // 4. Test GET tasks for employee
        console.log('4. Récupération des tâches d\'un employé...');
        try {
            const employeTasksResponse = await axios.get(`${API_BASE}/tasks/employe/69d61faff85ea7a7c75b15ae`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            console.log(`✅ ${employeTasksResponse.data.data.length} tâches pour l'employé`);
        } catch (error) {
            console.log('❌ Erreur lors de la récupération des tâches de l\'employé:', error.response?.data || error.message);
        }
        console.log();

        // 5. Test POST create task
        console.log('5. Création d\'une nouvelle tâche...');
        try {
            const newTask = {
                titre: 'Test tâche API',
                description: 'Tâche de test pour vérifier l\'API',
                employeAssigne: '69d61faff85ea7a7c75b15ae',
                categorie: 'Test',
                priorite: 'Moyenne',
                dureeEstimee: 4
            };
            const createResponse = await axios.post(`${API_BASE}/tasks`, newTask, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            console.log('✅ Tâche créée:', createResponse.data.data.titre);
            console.log('   ID:', createResponse.data.data._id);
        } catch (error) {
            console.log('❌ Erreur lors de la création de la tâche:', error.response?.data || error.message);
        }
        console.log();

        console.log('=== Tests terminés ===');

    } catch (error) {
        console.error('❌ Erreur critique:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

// Run tests if server is running
testTasksAPI();

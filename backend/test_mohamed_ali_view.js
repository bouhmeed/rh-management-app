const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testMohamedAliView() {
    let authToken = null;

    console.log('=== Test de la vue de Mohamed Ali ===\n');

    try {
        // 1. Login as Mohamed Ali
        console.log('1. Connexion en tant que mohamed.ali@entreprise.com...');
        try {
            const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
                email: 'mohamed.ali@entreprise.com',
                motDePasse: 'password123'  // Mot de passe par défaut?
            });
            authToken = loginResponse.data.token;
            console.log('✅ Connexion réussie');
            console.log('   Rôle:', loginResponse.data.utilisateur.role);
            console.log('   Employé ID:', loginResponse.data.utilisateur.employe?._id);
        } catch (error) {
            console.log('❌ Erreur de connexion (mot de passe incorrect?):', error.response?.data || error.message);
            console.log('   Note: Le mot de passe par défaut peut être différent');
            return;
        }
        console.log();

        // 2. Test GET all tasks (what he currently sees)
        console.log('2. Toutes les tâches (GET /api/tasks):');
        try {
            const allTasksResponse = await axios.get(`${API_BASE}/tasks`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            console.log(`✅ ${allTasksResponse.data.data.length} tâches trouvées`);
            allTasksResponse.data.data.forEach((task, index) => {
                console.log(`   ${index + 1}. ${task.titre} - Assignée à: ${task.employeAssigne?.prenom} ${task.employeAssigne?.nom}`);
            });
        } catch (error) {
            console.log('❌ Erreur:', error.response?.data || error.message);
        }
        console.log();

        // 3. Test GET his tasks only (what he SHOULD see)
        if (loginResponse.data.utilisateur.employe?._id) {
            const employeId = loginResponse.data.utilisateur.employe._id;
            console.log('3. Ses tâches uniquement (GET /api/tasks/employe/:employeId):');
            try {
                const hisTasksResponse = await axios.get(`${API_BASE}/tasks/employe/${employeId}`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                console.log(`✅ ${hisTasksResponse.data.data.length} tâches assignées à Mohamed Ali`);
                hisTasksResponse.data.data.forEach((task, index) => {
                    console.log(`   ${index + 1}. ${task.titre} - ${task.statut} - ${task.priorite}`);
                });
            } catch (error) {
                console.log('❌ Erreur:', error.response?.data || error.message);
            }
        }
        console.log();

        console.log('=== Analyse ===');
        console.log('⚠️ Mohamed Ali peut actuellement voir TOUTES les tâches de l\'entreprise');
        console.log('✅ Il devrait voir SEULEMENT ses propres tâches');
        console.log('💡 Solution: Ajouter une restriction basée sur le rôle dans les routes');

    } catch (error) {
        console.error('❌ Erreur critique:', error.message);
    }
}

testMohamedAliView();

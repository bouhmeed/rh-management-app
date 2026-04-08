const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAPIs() {
    const results = {
        utilisateurs: { status: 'unknown', data: null, error: null },
        roles: { status: 'unknown', data: null, error: null },
        employes: { status: 'unknown', data: null, error: null },
        departements: { status: 'unknown', data: null, error: null },
        contrats: { status: 'unknown', data: null, error: null },
        conges: { status: 'unknown', data: null, error: null },
        presences: { status: 'unknown', data: null, error: null },
        paies: { status: 'unknown', data: null, error: null },
        taches: { status: 'unknown', data: null, error: null },
        projets: { status: 'unknown', data: null, error: null }
    };

    const tests = [
        { name: 'utilisateurs', url: `${API_BASE}/auth/me`, method: 'GET' },
        { name: 'roles', url: `${API_BASE}/roles`, method: 'GET' },
        { name: 'employes', url: `${API_BASE}/employes`, method: 'GET' },
        { name: 'departements', url: `${API_BASE}/departements`, method: 'GET' },
        { name: 'contrats', url: `${API_BASE}/contrats`, method: 'GET' },
        { name: 'conges', url: `${API_BASE}/conges`, method: 'GET' },
        { name: 'presences', url: `${API_BASE}/presences`, method: 'GET' },
        { name: 'paies', url: `${API_BASE}/paies`, method: 'GET' },
        { name: 'taches', url: `${API_BASE}/taches`, method: 'GET' },
        { name: 'projets', url: `${API_BASE}/projets`, method: 'GET' }
    ];

    for (const test of tests) {
        try {
            console.log(`Testing ${test.name}...`);
            const response = await axios({
                method: test.method,
                url: test.url,
                timeout: 5000
            });
            
            results[test.name] = {
                status: 'success',
                data: response.data,
                count: Array.isArray(response.data?.data) ? response.data.data.length : 
                      response.data ? 1 : 0,
                error: null
            };
            
            console.log(`✅ ${test.name}: SUCCESS (${results[test.name].count} items)`);
        } catch (error) {
            results[test.name] = {
                status: 'error',
                data: null,
                error: error.response?.data?.message || error.message
            };
            
            console.log(`❌ ${test.name}: ERROR - ${results[test.name].error}`);
        }
    }

    return results;
}

async function main() {
    console.log('🧪 Testing API Endpoints...\n');
    
    const results = await testAPIs();
    
    console.log('\n📊 API Test Results Summary:');
    console.log('=====================================');
    
    for (const [endpoint, result] of Object.entries(results)) {
        console.log(`\n${endpoint.toUpperCase()}:`);
        console.log(`  Status: ${result.status.toUpperCase()}`);
        console.log(`  Count: ${result.count || 'N/A'}`);
        if (result.error) {
            console.log(`  Error: ${result.error}`);
        }
    }
    
    // Save results to file
    require('fs').writeFileSync(
        'api_test_results.json', 
        JSON.stringify(results, null, 2)
    );
    
    console.log('\n💾 Results saved to api_test_results.json');
}

main().catch(console.error);

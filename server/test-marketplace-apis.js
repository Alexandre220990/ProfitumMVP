const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3001/api';

async function testMarketplaceAPIs() {
    console.log('🧪 Test des APIs Marketplace...\n');

    try {
        // 1. Test de récupération des experts
        console.log('1️⃣ Test API /experts/marketplace');
        const expertsResponse = await axios.get(`${BASE_URL}/experts/marketplace`);
        console.log(`✅ ${expertsResponse.data.length} experts récupérés`);
        console.log('   - Premier expert:', expertsResponse.data[0]?.name || 'N/A');

        // 2. Test de récupération des assignations
        console.log('\n2️⃣ Test API /experts/assignments');
        const assignmentsResponse = await axios.get(`${BASE_URL}/experts/assignments`);
        console.log(`✅ ${assignmentsResponse.data.length} assignations récupérées`);
        console.log('   - Première assignation:', assignmentsResponse.data[0]?.id || 'N/A');

        // 3. Test de création d'une assignation
        console.log('\n3️⃣ Test création assignation');
        const newAssignment = {
            expert_id: expertsResponse.data[0]?.id,
            client_id: 'test-client-id',
            status: 'pending',
            compensation_amount: 2000.00,
            compensation_percentage: 20.0,
            notes: 'Test API assignation'
        };
        
        const createResponse = await axios.post(`${BASE_URL}/experts/assignments`, newAssignment);
        console.log('✅ Assignation créée:', createResponse.data.id);

        // 4. Test de récupération des messages
        console.log('\n4️⃣ Test API /experts/assignments/{id}/messages');
        const messagesResponse = await axios.get(`${BASE_URL}/experts/assignments/${createResponse.data.id}/messages`);
        console.log(`✅ ${messagesResponse.data.length} messages récupérés`);

        // 5. Test de création d'un message
        console.log('\n5️⃣ Test création message');
        const newMessage = {
            content: 'Test message via API',
            message_type: 'text',
            sender_id: expertsResponse.data[0]?.id,
            sender_type: 'expert'
        };
        
        const messageResponse = await axios.post(`${BASE_URL}/experts/assignments/${createResponse.data.id}/messages`, newMessage);
        console.log('✅ Message créé:', messageResponse.data.id);

        // 6. Test de récupération des notifications
        console.log('\n6️⃣ Test API /notifications');
        const notificationsResponse = await axios.get(`${BASE_URL}/notifications`);
        console.log(`✅ ${notificationsResponse.data.length} notifications récupérées`);

        console.log('\n🎉 Tous les tests APIs marketplace PASSÉS !');
        console.log('\n📊 Résumé des APIs testées:');
        console.log('   ✅ GET /experts/marketplace');
        console.log('   ✅ GET /experts/assignments');
        console.log('   ✅ POST /experts/assignments');
        console.log('   ✅ GET /experts/assignments/{id}/messages');
        console.log('   ✅ POST /experts/assignments/{id}/messages');
        console.log('   ✅ GET /notifications');

    } catch (error) {
        console.error('❌ Erreur test APIs:', error.response?.data || error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Le serveur backend n\'est pas démarré.');
            console.log('   Démarrez-le avec: npm run dev');
        }
    }
}

testMarketplaceAPIs(); 
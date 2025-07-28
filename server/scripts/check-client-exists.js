const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function checkClientExists() {
  console.log('🔍 VÉRIFICATION EXISTENCE CLIENT');
  console.log('=' .repeat(40));

  try {
    // 1. Se connecter
    console.log('\n🔐 1. Connexion...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-migration@example.com',
        password: 'TestPassword123!'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Échec connexion:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Connexion réussie');
    console.log('🔑 Token:', token.substring(0, 20) + '...');

    // 2. Vérifier les informations du client connecté
    console.log('\n👤 2. Informations du client connecté...');
    console.log('📧 Email connecté:', loginData.data.user?.email);
    console.log('🆔 ID utilisateur:', loginData.data.user?.id);

    // 3. Tester une requête directe pour récupérer le client
    console.log('\n🔍 3. Test requête directe client...');
    
    const clientResponse = await fetch(`${API_URL}/api/clients/profile`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (clientResponse.ok) {
      const clientData = await clientResponse.json();
      console.log('✅ Données client récupérées:');
      console.log('📋 Client:', JSON.stringify(clientData, null, 2));
    } else {
      console.log('⚠️ Impossible de récupérer les données client');
      const errorText = await clientResponse.text();
      console.log('📋 Erreur:', errorText);
    }

    // 4. Tester une requête pour lister tous les clients (si admin)
    console.log('\n🔍 4. Test liste clients...');
    
    const listResponse = await fetch(`${API_URL}/api/admin/clients`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('✅ Liste clients récupérée');
      console.log('📊 Nombre de clients:', listData.data?.length || 0);
      
      const testClient = listData.data?.find(c => c.email === 'test-migration@example.com');
      if (testClient) {
        console.log('✅ Client de test trouvé dans la liste:');
        console.log('📋 ID:', testClient.id);
        console.log('📋 Email:', testClient.email);
        console.log('📋 Username:', testClient.username);
      } else {
        console.log('❌ Client de test non trouvé dans la liste');
      }
    } else {
      console.log('⚠️ Impossible de récupérer la liste des clients');
      const errorText = await listResponse.text();
      console.log('📋 Erreur:', errorText);
    }

    // 5. Tester une requête directe en base (via une route de debug)
    console.log('\n🔍 5. Test requête directe en base...');
    
    const debugResponse = await fetch(`${API_URL}/api/debug/client-by-email`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: 'test-migration@example.com'
      })
    });

    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ Requête debug réussie:');
      console.log('📋 Résultat:', JSON.stringify(debugData, null, 2));
    } else {
      console.log('⚠️ Route debug non disponible');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('📋 Stack:', error.stack);
  }
}

checkClientExists(); 
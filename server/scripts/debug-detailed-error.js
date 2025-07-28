const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function debugDetailedError() {
  console.log('🔍 DEBUG DÉTAILLÉ DE L\'ERREUR');
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

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Connexion réussie');

    // 2. Créer une session
    console.log('\n🔄 2. Création session...');
    const sessionResponse = await fetch(`${API_URL}/api/simulator/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip_address: '127.0.0.1',
        user_agent: 'Debug Detailed'
      })
    });

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.session_token;
    console.log('✅ Session créée:', sessionToken);

    // 3. Test avec un seul produit et capture d'erreur détaillée
    console.log('\n🧪 3. Test avec capture d\'erreur détaillée...');
    
    const migrationData = {
      sessionToken: sessionToken,
      clientData: {
        email: 'test-migration@example.com',
        username: 'TestUser',
        company_name: 'Test Company'
      },
      eligibilityResults: [
        {
          produit_id: 'TICPE',
          eligibility_score: 75,
          estimated_savings: 4388,
          confidence_level: 'high',
          recommendations: ['Test détaillé']
        }
      ]
    };

    console.log('📤 Données envoyées:', JSON.stringify(migrationData, null, 2));

    const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Debug-Request': 'true'
      },
      body: JSON.stringify(migrationData)
    });

    console.log('📥 Status:', migrationResponse.status);
    console.log('📥 Headers:', Object.fromEntries(migrationResponse.headers.entries()));

    const responseText = await migrationResponse.text();
    console.log('📥 Réponse complète:', responseText);

    if (migrationResponse.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ Migration réussie:', result);
      } catch (e) {
        console.log('⚠️ Réponse non-JSON:', responseText);
      }
    } else {
      console.log('❌ Migration échouée');
      
      // Essayer de parser l'erreur
      try {
        const errorData = JSON.parse(responseText);
        console.log('📋 Détails erreur:', errorData);
      } catch (e) {
        console.log('📋 Erreur brute:', responseText);
      }
    }

    // 4. Vérifier les logs du serveur en testant une route simple
    console.log('\n🔍 4. Test route simple pour vérifier les logs...');
    
    const simpleResponse = await fetch(`${API_URL}/api/session-migration/session-data/${sessionToken}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('📥 Status route simple:', simpleResponse.status);
    const simpleText = await simpleResponse.text();
    console.log('📥 Réponse route simple:', simpleText);

    // 5. Test avec un produit qui fonctionnait avant
    console.log('\n🔍 5. Test avec produit qui fonctionnait avant...');
    
    const migrationDataWorking = {
      sessionToken: sessionToken,
      clientData: {
        email: 'test-migration@example.com',
        username: 'TestUser',
        company_name: 'Test Company'
      },
      eligibilityResults: [] // Données vides
    };

    const migrationResponseWorking = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(migrationDataWorking)
    });

    console.log('📥 Status avec données vides:', migrationResponseWorking.status);
    const responseTextWorking = await migrationResponseWorking.text();
    console.log('📥 Réponse avec données vides:', responseTextWorking);

    console.log('\n📋 INSTRUCTIONS POUR VÉRIFIER LES LOGS:');
    console.log('1. Allez sur Railway Dashboard');
    console.log('2. Sélectionnez votre projet');
    console.log('3. Allez dans l\'onglet "Deployments"');
    console.log('4. Cliquez sur le dernier déploiement');
    console.log('5. Allez dans l\'onglet "Logs"');
    console.log('6. Cherchez les erreurs liées à la migration');
    console.log('7. Cherchez les logs avec "X-Debug-Request: true"');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugDetailedError(); 
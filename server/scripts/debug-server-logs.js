const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function debugServerLogs() {
  console.log('🔍 DEBUG DES LOGS DU SERVEUR');
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
    console.log('✅ Connexion réussie');

    // 2. Créer une session
    console.log('\n🔄 2. Création session...');
    const sessionResponse = await fetch(`${API_URL}/api/simulator/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip_address: '127.0.0.1',
        user_agent: 'Debug Logs'
      })
    });

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.session_token;
    console.log('✅ Session créée:', sessionToken);

    // 3. Tester avec un produit simple et capturer tous les détails
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
          recommendations: ['Test logs']
        }
      ]
    };

    console.log('📤 Données envoyées:', JSON.stringify(migrationData, null, 2));

    // 4. Faire plusieurs tentatives pour générer des logs
    for (let i = 1; i <= 3; i++) {
      console.log(`\n🔄 Tentative ${i}/3...`);
      
      const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Debug-Attempt': i.toString()
        },
        body: JSON.stringify(migrationData)
      });

      console.log(`📥 Status tentative ${i}:`, migrationResponse.status);
      
      const responseText = await migrationResponse.text();
      console.log(`📥 Réponse tentative ${i}:`, responseText);
      
      if (!migrationResponse.ok) {
        console.log(`❌ Erreur tentative ${i} - Vérifiez les logs Railway`);
      }
      
      // Attendre un peu entre les tentatives
      if (i < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // 5. Tester une route qui fonctionne pour comparer
    console.log('\n🔍 5. Test route fonctionnelle...');
    
    const workingResponse = await fetch(`${API_URL}/api/session-migration/session-data/${sessionToken}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('📥 Status route fonctionnelle:', workingResponse.status);
    const workingText = await workingResponse.text();
    console.log('📥 Réponse route fonctionnelle:', workingText);

    console.log('\n📋 INSTRUCTIONS POUR VÉRIFIER LES LOGS:');
    console.log('1. Allez sur Railway Dashboard');
    console.log('2. Sélectionnez votre projet');
    console.log('3. Allez dans l\'onglet "Deployments"');
    console.log('4. Cliquez sur le dernier déploiement');
    console.log('5. Allez dans l\'onglet "Logs"');
    console.log('6. Cherchez les erreurs liées à la migration');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugServerLogs(); 
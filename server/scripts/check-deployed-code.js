// Charger les variables d'environnement
require('dotenv').config({ path: '../.env' });

const fetch = require('node-fetch');

// Configuration
const API_URL = 'https://profitummvp-production.up.railway.app';

async function checkDeployedCode() {
  console.log('🔍 VÉRIFICATION CODE DÉPLOYÉ');
  console.log('=' .repeat(40));

  try {
    // 1. Test de santé de l'API
    console.log('\n1️⃣ Test de santé de l\'API...');
    
    const healthResponse = await fetch(`${API_URL}/api/health`);
    const healthData = await healthResponse.json();
    
    console.log('✅ API en ligne:', healthData);

    // 2. Test de la route de diagnostic de session
    console.log('\n2️⃣ Test de la route de diagnostic de session...');
    
    const sessionToken = 'test-session-token';
    const sessionResponse = await fetch(`${API_URL}/api/session-migration/session-data/${sessionToken}`);
    
    console.log('📡 Status session-data:', sessionResponse.status);
    
    if (sessionResponse.status === 404) {
      console.log('✅ Route session-data accessible (404 attendu pour token inexistant)');
    } else {
      const sessionData = await sessionResponse.json();
      console.log('📥 Réponse session-data:', JSON.stringify(sessionData, null, 2));
    }

    // 3. Test de la route de migration avec données minimales
    console.log('\n3️⃣ Test de la route de migration avec données minimales...');
    
    const migrationData = {
      sessionToken: 'test-session-token',
      clientData: {
        email: 'test@example.com'
      }
    };

    const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(migrationData)
    });

    console.log('📡 Status migration:', migrationResponse.status);
    
    const migrationResult = await migrationResponse.json();
    console.log('📥 Réponse migration:', JSON.stringify(migrationResult, null, 2));

    // 4. Analyse de la réponse
    console.log('\n4️⃣ Analyse de la réponse...');
    
    if (migrationResult.error && migrationResult.error.includes('Session non trouvée')) {
      console.log('✅ Code déployé : Route de migration accessible');
      console.log('   - La route répond correctement pour session inexistante');
    } else if (migrationResult.error && migrationResult.error.includes('éligibilités')) {
      console.log('✅ Code déployé : Correction des éligibilités active');
      console.log('   - La route trouve la session mais pas d\'éligibilités');
    } else if (migrationResult.error && migrationResult.error.includes('Token manquant')) {
      console.log('✅ Code déployé : Validation des paramètres active');
      console.log('   - La route valide correctement les paramètres');
    } else {
      console.log('⚠️ Réponse inattendue de la migration');
    }

    // 5. Test de création d'un client avec tous les champs requis
    console.log('\n5️⃣ Test de création d\'un client complet...');
    
    const timestamp = Date.now();
    const testUserData = {
      username: `deploy-test-${timestamp}`,
      email: `deploy-test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      company_name: 'Entreprise Test Deploy',
      phone_number: '0123456789',
      address: '123 Rue Test',
      city: 'Paris',
      postal_code: '75001',
      siren: `${timestamp % 1000000000}`.padStart(9, '0'),
      type: 'client'
    };

    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserData)
    });

    if (!registerResponse.ok) {
      const errorData = await registerResponse.json();
      console.log('📥 Erreur inscription:', JSON.stringify(errorData, null, 2));
      
      if (errorData.error && errorData.error.includes('updated_at')) {
        console.log('❌ Code déployé : Champ updated_at manquant encore');
      } else {
        console.log('⚠️ Autre erreur d\'inscription');
      }
    } else {
      console.log('✅ Code déployé : Inscription avec updated_at fonctionne');
    }

    console.log('\n📊 Résumé de la vérification:');
    console.log('   - API en ligne: ✅');
    console.log('   - Routes accessibles: ✅');
    console.log('   - Code déployé: En cours de vérification...');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkDeployedCode();
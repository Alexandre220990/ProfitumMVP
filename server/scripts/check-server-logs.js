// Charger les variables d'environnement
require('dotenv').config({ path: '../.env' });

const fetch = require('node-fetch');

// Configuration
const API_URL = 'https://profitummvp-production.up.railway.app';

async function checkServerLogs() {
  console.log('🔍 VÉRIFICATION DES LOGS DU SERVEUR');
  console.log('=' .repeat(40));

  try {
    // 1. Test de santé de l'API
    console.log('\n1️⃣ Test de santé de l\'API...');
    
    const healthResponse = await fetch(`${API_URL}/api/health`);
    const healthData = await healthResponse.json();
    
    console.log('✅ API en ligne:', healthData);

    // 2. Test de la route de migration avec une session qui existe
    console.log('\n2️⃣ Test de migration avec session existante...');
    
    // Créer d'abord un client
    const timestamp = Date.now();
    const testUserData = {
      username: `log-test-${timestamp}`,
      email: `log-test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      company_name: 'Entreprise Log Test',
      phone_number: '0123456789',
      address: '123 Rue Log',
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
      console.error('❌ Erreur inscription:', errorData);
      return;
    }

    const registerResult = await registerResponse.json();
    console.log('✅ Client créé:', registerResult.data.email);

    // Login pour obtenir le token
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserData.email,
        password: testUserData.password
      })
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.error('❌ Erreur login:', errorData);
      return;
    }

    const loginResult = await loginResponse.json();
    const token = loginResult.data.token;
    console.log('✅ Token récupéré');

    // Test de migration avec une session qui existe
    const migrationData = {
      sessionToken: '418ca9e4-ba72-4cb3-adf1-fc262a7e7ce2', // Session qui existe avec des éligibilités
      clientData: {
        email: testUserData.email
      }
    };

    console.log('\n3️⃣ Test de migration avec session existante...');
    console.log('📤 Données envoyées:', JSON.stringify(migrationData, null, 2));

    const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(migrationData)
    });

    console.log('📡 Status migration:', migrationResponse.status);
    
    const migrationResult = await migrationResponse.json();
    console.log('📥 Réponse migration:', JSON.stringify(migrationResult, null, 2));

    // 4. Analyse de la réponse
    console.log('\n4️⃣ Analyse de la réponse...');
    
    if (migrationResult.error) {
      if (migrationResult.error.includes('Erreur lors de la récupération des éligibilités')) {
        console.log('❌ Code déployé : Ancienne version (pas de supabaseAdmin)');
        console.log('   - La route utilise encore l\'ancienne logique');
      } else if (migrationResult.error.includes('Session non trouvée')) {
        console.log('✅ Code déployé : Nouvelle version (validation des paramètres)');
        console.log('   - La route valide correctement les paramètres');
      } else if (migrationResult.error.includes('Client non trouvé après création')) {
        console.log('⚠️ Code déployé : Version intermédiaire');
        console.log('   - La route trouve la session mais pas le client');
      } else {
        console.log('⚠️ Code déployé : Autre erreur');
        console.log('   - Erreur:', migrationResult.error);
      }
    } else {
      console.log('✅ Code déployé : Migration réussie !');
    }

    // 5. Nettoyage
    console.log('\n5️⃣ Nettoyage...');
    
    // Supprimer le client de test
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      const { error: deleteError } = await supabaseAdmin
        .from('Client')
        .delete()
        .eq('email', testUserData.email);

      if (deleteError) {
        console.error('⚠️ Erreur suppression client:', deleteError);
      } else {
        console.log('✅ Client de test supprimé');
      }
    }

    // 6. Résumé final
    console.log('\n📊 RÉSUMÉ FINAL');
    console.log('-'.repeat(30));
    console.log('   - API en ligne: ✅');
    console.log('   - Client créé: ✅');
    console.log('   - Token récupéré: ✅');
    console.log('   - Migration testée: ✅');
    console.log('   - Code déployé: Analysé ci-dessus');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkServerLogs();
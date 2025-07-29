// Charger les variables d'environnement
require('dotenv').config({ path: '../.env' });

const fetch = require('node-fetch');

// Configuration
const API_URL = 'https://profitummvp-production.up.railway.app';

async function testApiMigrationDetailed() {
  console.log('🔍 TEST DÉTAILLÉ API MIGRATION');
  console.log('=' .repeat(40));

  try {
    // 1. Créer un client de test
    console.log('\n1️⃣ Création d\'un client de test...');
    
    const timestamp = Date.now();
    const testUserData = {
      username: `api-test-${timestamp}`,
      email: `api-test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      company_name: 'Entreprise API Test',
      phone_number: '0123456789',
      address: '123 Rue API Test',
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

    // 2. Login pour obtenir le token
    console.log('\n2️⃣ Login pour obtenir le token...');
    
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

    // 3. Test de migration avec une session qui existe
    console.log('\n3️⃣ Test de migration avec session existante...');
    
    const migrationData = {
      sessionToken: 'e06c09f5-4a35-404b-b8b9-f2977bb6c7de', // Session qui existe avec des éligibilités
      clientData: {
        email: testUserData.email
      }
    };

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
    console.log('📡 Headers migration:', Object.fromEntries(migrationResponse.headers.entries()));
    
    const migrationResult = await migrationResponse.json();
    console.log('📥 Réponse migration:', JSON.stringify(migrationResult, null, 2));

    // 4. Test de migration avec une session inexistante
    console.log('\n4️⃣ Test de migration avec session inexistante...');
    
    const migrationDataInvalid = {
      sessionToken: 'session-inexistante',
      clientData: {
        email: testUserData.email
      }
    };

    const migrationResponseInvalid = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(migrationDataInvalid)
    });

    console.log('📡 Status migration (session inexistante):', migrationResponseInvalid.status);
    
    const migrationResultInvalid = await migrationResponseInvalid.json();
    console.log('📥 Réponse migration (session inexistante):', JSON.stringify(migrationResultInvalid, null, 2));

    // 5. Test de migration sans token
    console.log('\n5️⃣ Test de migration sans token...');
    
    const migrationResponseNoToken = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(migrationData)
    });

    console.log('📡 Status migration (sans token):', migrationResponseNoToken.status);
    
    const migrationResultNoToken = await migrationResponseNoToken.json();
    console.log('📥 Réponse migration (sans token):', JSON.stringify(migrationResultNoToken, null, 2));

    // 6. Test de migration avec données manquantes
    console.log('\n6️⃣ Test de migration avec données manquantes...');
    
    const migrationDataMissing = {
      sessionToken: 'e06c09f5-4a35-404b-b8b9-f2977bb6c7de'
      // clientData manquant
    };

    const migrationResponseMissing = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(migrationDataMissing)
    });

    console.log('📡 Status migration (données manquantes):', migrationResponseMissing.status);
    
    const migrationResultMissing = await migrationResponseMissing.json();
    console.log('📥 Réponse migration (données manquantes):', JSON.stringify(migrationResultMissing, null, 2));

    // 7. Test de l'API produits éligibles
    console.log('\n7️⃣ Test de l\'API produits éligibles...');
    
    const productsResponse = await fetch(`${API_URL}/api/client/produits-eligibles`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📡 Status produits éligibles:', productsResponse.status);
    
    const productsResult = await productsResponse.json();
    console.log('📥 Réponse produits éligibles:', JSON.stringify(productsResult, null, 2));

    // 8. Nettoyage
    console.log('\n8️⃣ Nettoyage...');
    
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

    // 9. Analyse des résultats
    console.log('\n📊 ANALYSE DES RÉSULTATS');
    console.log('-'.repeat(30));
    
    console.log('🔍 Migration avec session existante:');
    if (migrationResponse.status === 200) {
      console.log('   ✅ Succès - Code déployé avec corrections');
    } else if (migrationResult.error && migrationResult.error.includes('Erreur lors de la récupération des éligibilités')) {
      console.log('   ❌ Échec - Code non déployé (ancienne version)');
    } else if (migrationResult.error && migrationResult.error.includes('Session non trouvée')) {
      console.log('   ⚠️ Échec - Code déployé mais session non trouvée');
    } else {
      console.log('   ⚠️ Échec - Autre erreur:', migrationResult.error);
    }

    console.log('🔍 Migration avec session inexistante:');
    if (migrationResponseInvalid.status === 404) {
      console.log('   ✅ Comportement attendu - Session non trouvée');
    } else {
      console.log('   ⚠️ Comportement inattendu - Status:', migrationResponseInvalid.status);
    }

    console.log('🔍 Migration sans token:');
    if (migrationResponseNoToken.status === 401 || migrationResponseNoToken.status === 403) {
      console.log('   ✅ Comportement attendu - Authentification requise');
    } else {
      console.log('   ⚠️ Comportement inattendu - Status:', migrationResponseNoToken.status);
    }

    console.log('🔍 Migration avec données manquantes:');
    if (migrationResponseMissing.status === 400) {
      console.log('   ✅ Comportement attendu - Validation des données');
    } else {
      console.log('   ⚠️ Comportement inattendu - Status:', migrationResponseMissing.status);
    }

    console.log('🔍 API produits éligibles:');
    if (productsResponse.status === 200) {
      console.log('   ✅ Succès - API accessible');
    } else {
      console.log('   ❌ Échec - Status:', productsResponse.status);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testApiMigrationDetailed();
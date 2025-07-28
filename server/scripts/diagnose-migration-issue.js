const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function diagnoseMigrationIssue() {
  console.log('🔍 DIAGNOSTIC COMPLET DU PROBLÈME DE MIGRATION');
  console.log('=' .repeat(60));

  try {
    // 1. Test de connexion
    console.log('\n📊 1. Test de connexion...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-migration@example.com',
        password: 'TestPassword123!'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Échec de connexion:', loginResponse.status);
      const errorText = await loginResponse.text();
      console.log('Erreur:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Connexion réussie');
    
    if (!loginData.success || !loginData.data?.token) {
      console.log('❌ Token manquant dans la réponse');
      return;
    }

    const token = loginData.data.token;
    console.log('🔑 Token obtenu:', token.substring(0, 30) + '...');

    // 2. Test de la route produits-eligibles
    console.log('\n📊 2. Test de la route produits-eligibles...');
    const produitsResponse = await fetch(`${API_URL}/api/client/produits-eligibles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status produits-eligibles:', produitsResponse.status);
    
    if (produitsResponse.ok) {
      const produitsData = await produitsResponse.json();
      console.log('✅ Produits éligibles récupérés:', produitsData.success);
      console.log('📊 Nombre de produits:', produitsData.data?.length || 0);
    } else {
      const errorText = await produitsResponse.text();
      console.log('❌ Erreur produits-eligibles:', errorText);
    }

    // 3. Test de création de session temporaire
    console.log('\n📊 3. Test de création de session temporaire...');
    const sessionResponse = await fetch(`${API_URL}/api/simulator/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip_address: '127.0.0.1',
        user_agent: 'Test Script'
      })
    });

    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log('✅ Session créée:', sessionData.success);
      
      if (sessionData.success && sessionData.data?.session_token) {
        const sessionToken = sessionData.data.session_token;
        console.log('🔑 Session token:', sessionToken.substring(0, 30) + '...');

        // 4. Test d'ajout de réponse
        console.log('\n📊 4. Test d\'ajout de réponse...');
        const responseData = {
          sessionToken: sessionToken,
          questionId: 'test-question-id',
          responseValue: { value: 'test-response' }
        };

        const responseResponse = await fetch(`${API_URL}/api/simulator/response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(responseData)
        });

        if (responseResponse.ok) {
          console.log('✅ Réponse ajoutée');
        } else {
          const errorText = await responseResponse.text();
          console.log('❌ Erreur ajout réponse:', errorText);
        }

        // 5. Test de calcul d'éligibilité
        console.log('\n📊 5. Test de calcul d\'éligibilité...');
        const eligibilityResponse = await fetch(`${API_URL}/api/simulator/calculate-eligibility`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken })
        });

        if (eligibilityResponse.ok) {
          const eligibilityData = await eligibilityResponse.json();
          console.log('✅ Éligibilité calculée:', eligibilityData.success);
          console.log('📊 Résultats:', eligibilityData.data?.length || 0);
        } else {
          const errorText = await eligibilityResponse.text();
          console.log('❌ Erreur calcul éligibilité:', errorText);
        }

        // 6. Test de migration
        console.log('\n📊 6. Test de migration...');
        const migrationData = {
          sessionToken: sessionToken,
          clientData: {
            email: 'test@example.com',
            username: 'Test User',
            company_name: 'Test Company'
          },
          eligibilityResults: [
            {
              produit_id: 'TICPE',
              eligibility_score: 75,
              estimated_savings: 4388,
              confidence_level: 'high',
              recommendations: ['Optimisation recommandée']
            }
          ]
        };

        const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(migrationData)
        });

        console.log('Status migration:', migrationResponse.status);
        
        if (migrationResponse.ok) {
          const migrationResult = await migrationResponse.json();
          console.log('✅ Migration réussie:', migrationResult.success);
          console.log('📊 Produits migrés:', migrationResult.data?.migrated_count || 0);
        } else {
          const errorText = await migrationResponse.text();
          console.log('❌ Erreur migration:', errorText);
        }
      }
    } else {
      const errorText = await sessionResponse.text();
      console.log('❌ Erreur création session:', errorText);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

diagnoseMigrationIssue(); 
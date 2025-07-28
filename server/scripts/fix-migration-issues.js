const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function fixMigrationIssues() {
  console.log('🔧 CORRECTION DES PROBLÈMES DE MIGRATION');
  console.log('=' .repeat(50));

  try {
    // 1. Créer un client de test avec des données complètes
    console.log('\n📝 1. Création d\'un client de test...');
    const registerData = {
      username: 'TestMigrationUser',
      email: 'test-migration2@example.com',
      password: 'TestPassword123!',
      company_name: 'Test Migration Company',
      phone_number: '0123456789',
      address: '123 Test Street',
      city: 'Test City',
      postal_code: '12345',
      siren: '987654322',
      type: 'client'
    };

    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      console.log('❌ Erreur inscription:', errorText);
      return;
    }

    const registerResult = await registerResponse.json();
    console.log('✅ Client créé:', registerResult.success);

    if (!registerResult.success || !registerResult.data?.token) {
      console.log('❌ Token manquant après inscription');
      return;
    }

    const token = registerResult.data.token;
    const clientEmail = registerData.email;
    console.log('🔑 Token obtenu:', token.substring(0, 30) + '...');

    // 2. Vérifier que le client peut accéder à ses produits éligibles
    console.log('\n🔍 2. Vérification de l\'accès aux produits éligibles...');
    const produitsResponse = await fetch(`${API_URL}/api/client/produits-eligibles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status produits-eligibles:', produitsResponse.status);
    
    if (produitsResponse.ok) {
      const produitsData = await produitsResponse.json();
      console.log('✅ Accès aux produits éligibles OK');
      console.log('📊 Produits existants:', produitsData.data?.length || 0);
    } else {
      const errorText = await produitsResponse.text();
      console.log('❌ Problème d\'accès aux produits:', errorText);
    }

    // 3. Créer une session de simulation complète
    console.log('\n🔄 3. Création d\'une session de simulation...');
    const sessionResponse = await fetch(`${API_URL}/api/simulator/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip_address: '127.0.0.1',
        user_agent: 'Test Migration Script'
      })
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.log('❌ Erreur création session:', errorText);
      return;
    }

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.data.session_token;
    console.log('✅ Session créée:', sessionToken.substring(0, 30) + '...');

    // 4. Ajouter des réponses de test avec des UUIDs réels
    console.log('\n📝 4. Ajout de réponses de test...');
    
    // Récupérer les vraies questions depuis la base
    const questionsResponse = await fetch(`${API_URL}/api/simulator/questions`);
    let realQuestionId = 'test-question-id';
    
    if (questionsResponse.ok) {
      const questionsData = await questionsResponse.json();
      if (questionsData.data && questionsData.data.length > 0) {
        realQuestionId = questionsData.data[0].id;
        console.log('🔍 Question réelle trouvée:', realQuestionId);
      }
    }

    const testResponses = [
      {
        sessionToken: sessionToken,
        questionId: realQuestionId,
        responseValue: { 
          value: 'transport_routier',
          details: { 
            type_vehicule: 'poids_lourd',
            nombre_vehicules: 5,
            consommation_annuelle: 50000
          }
        }
      }
    ];

    for (const response of testResponses) {
      const responseResponse = await fetch(`${API_URL}/api/simulator/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response)
      });

      if (responseResponse.ok) {
        console.log('✅ Réponse ajoutée pour question:', response.questionId);
      } else {
        const errorText = await responseResponse.text();
        console.log('❌ Erreur ajout réponse:', errorText);
      }
    }

    // 5. Calculer l'éligibilité
    console.log('\n🧮 5. Calcul de l\'éligibilité...');
    const eligibilityResponse = await fetch(`${API_URL}/api/simulator/calculate-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken })
    });

    let eligibilityResults = [];
    if (eligibilityResponse.ok) {
      const eligibilityData = await eligibilityResponse.json();
      eligibilityResults = eligibilityData.data || [];
      console.log('✅ Éligibilité calculée');
      console.log('📊 Résultats:', eligibilityResults.length);
      
      if (eligibilityResults.length > 0) {
        console.log('🎯 Premier résultat:', eligibilityResults[0]);
      }
    } else {
      const errorText = await eligibilityResponse.text();
      console.log('❌ Erreur calcul éligibilité:', errorText);
    }

    // 6. Tester la migration avec les vraies données
    console.log('\n🚀 6. Test de migration avec vraies données...');
    const migrationData = {
      sessionToken: sessionToken,
      clientData: {
        email: clientEmail,
        username: registerData.username,
        company_name: registerData.company_name
      },
      eligibilityResults: eligibilityResults.length > 0 ? eligibilityResults : [
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
      console.log('✅ Migration réussie!');
      console.log('📊 Produits migrés:', migrationResult.data?.migrated_count || 0);
      console.log('🎉 Session ID:', migrationResult.data?.session_id);
    } else {
      const errorText = await migrationResponse.text();
      console.log('❌ Erreur migration:', errorText);
    }

    // 7. Vérifier que les produits sont maintenant visibles
    console.log('\n🔍 7. Vérification finale des produits éligibles...');
    const finalProduitsResponse = await fetch(`${API_URL}/api/client/produits-eligibles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (finalProduitsResponse.ok) {
      const finalProduitsData = await finalProduitsResponse.json();
      console.log('✅ Vérification finale OK');
      console.log('📊 Produits éligibles après migration:', finalProduitsData.data?.length || 0);
      
      if (finalProduitsData.data && finalProduitsData.data.length > 0) {
        console.log('🎯 Premier produit:', finalProduitsData.data[0]);
      }
    } else {
      const errorText = await finalProduitsResponse.text();
      console.log('❌ Problème final:', errorText);
    }

    console.log('\n🎉 DIAGNOSTIC ET CORRECTION TERMINÉS');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

fixMigrationIssues(); 
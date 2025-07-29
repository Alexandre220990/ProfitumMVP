// Charger les variables d'environnement
require('dotenv').config({ path: '../.env' });

const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configuration
const API_URL = 'https://profitummvp-production.up.railway.app';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimulatorToDashboard() {
  console.log('🧪 TEST COMPLET : Simulateur → Inscription → Dashboard');
  console.log('=' .repeat(60));

  let sessionToken, clientId, authToken;

  try {
    // 1. Créer une session de simulateur
    console.log('\n1️⃣ Création d\'une session de simulateur...');
    
    sessionToken = crypto.randomUUID();
    const { data: session, error: sessionError } = await supabase
      .from('TemporarySession')
      .insert({
        session_token: sessionToken,
        ip_address: '127.0.0.1',
        user_agent: 'Test Script',
        completed: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Erreur création session: ${sessionError.message}`);
    }

    console.log('✅ Session créée:', sessionToken);

    // 2. Créer des résultats d'éligibilité
    console.log('\n2️⃣ Création des résultats d\'éligibilité...');
    
    const testResults = [
      {
        session_id: session.id,
        produit_id: 'TICPE',
        eligibility_score: 85,
        estimated_savings: 5000,
        confidence_level: 'high',
        recommendations: ['Optimisation fiscale TICPE', 'Réduction des coûts logistiques'],
        created_at: new Date().toISOString()
      },
      {
        session_id: session.id,
        produit_id: 'URSSAF',
        eligibility_score: 70,
        estimated_savings: 3000,
        confidence_level: 'medium',
        recommendations: ['Optimisation charges sociales'],
        created_at: new Date().toISOString()
      },
      {
        session_id: session.id,
        produit_id: 'DFS',
        eligibility_score: 90,
        estimated_savings: 8000,
        confidence_level: 'high',
        recommendations: ['Déclaration fiscale simplifiée'],
        created_at: new Date().toISOString()
      }
    ];

    const { data: eligibilityResults, error: eligibilityError } = await supabase
      .from('TemporaryEligibility')
      .insert(testResults)
      .select();

    if (eligibilityError) {
      throw new Error(`Erreur création éligibilité: ${eligibilityError.message}`);
    }

    console.log(`✅ ${eligibilityResults.length} résultats d'éligibilité créés`);

    // 3. Inscription via l'API (simulation du frontend)
    console.log('\n3️⃣ Inscription via l\'API...');
    
    const timestamp = Date.now();
    const testUserData = {
      username: `test-simulator-${timestamp}`,
      email: `test-simulator-${timestamp}@example.com`,
      password: 'TestPassword123!',
      company_name: 'Entreprise Test Simulateur',
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
      throw new Error(`Erreur inscription: ${errorData.message || registerResponse.statusText}`);
    }

    const registerResult = await registerResponse.json();
    authToken = registerResult.data.token;
    clientId = registerResult.data.user.id;

    console.log('✅ Inscription réussie:', testUserData.email);

    // 4. Migration des données de session
    console.log('\n4️⃣ Migration des données de session...');
    
    const migrationData = {
      sessionToken: sessionToken,
      sessionId: sessionToken,
      clientData: testUserData
    };

    const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(migrationData)
    });

    const migrationResult = await migrationResponse.json();
    
    if (migrationResult.success) {
      console.log('✅ Migration réussie');
      console.log(`   - Produits migrés: ${migrationResult.data.client_produit_eligibles?.length || 0}`);
    } else {
      console.warn('⚠️ Migration échouée:', migrationResult.error);
    }

    // 5. Vérifier les produits éligibles dans la base
    console.log('\n5️⃣ Vérification des produits éligibles en base...');
    
    const { data: clientProducts, error: dbError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible (
          id,
          nom,
          categorie,
          description
        )
      `)
      .eq('clientId', clientId);

    if (dbError) {
      console.error('❌ Erreur vérification base:', dbError);
    } else {
      console.log(`✅ ${clientProducts.length} produits éligibles trouvés en base:`);
      for (const product of clientProducts) {
        console.log(`   - ${product.ProduitEligible?.nom || product.produitId}: ${product.statut} (${product.montantFinal}€)`);
      }
    }

    // 6. Tester l'API produits éligibles (dashboard)
    console.log('\n6️⃣ Test de l\'API produits éligibles (dashboard)...');
    
    const productsResponse = await fetch(`${API_URL}/api/client/produits-eligibles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!productsResponse.ok) {
      const errorData = await productsResponse.json();
      console.error('❌ Erreur API produits éligibles:', errorData);
    } else {
      const productsResult = await productsResponse.json();
      console.log('✅ API produits éligibles accessible');
      console.log(`   - Produits retournés: ${productsResult.data?.length || 0}`);
      
      if (productsResult.data && productsResult.data.length > 0) {
        console.log('   - Détails des produits:');
        for (const product of productsResult.data) {
          console.log(`     * ${product.produit?.nom || 'Produit inconnu'}: ${product.statut} (${product.montantFinal}€)`);
        }
      }
    }

    // 7. Vérification finale
    console.log('\n7️⃣ Vérification finale...');
    
    const totalSavings = clientProducts?.reduce((sum, p) => sum + (p.montantFinal || 0), 0) || 0;
    const eligibleCount = clientProducts?.filter(p => p.statut === 'eligible').length || 0;

    console.log('📊 Résumé final:');
    console.log(`   - Client: ${testUserData.email}`);
    console.log(`   - Session: ${sessionToken}`);
    console.log(`   - Produits éligibles: ${eligibleCount}/${clientProducts?.length || 0}`);
    console.log(`   - Économies totales: ${totalSavings.toLocaleString()}€`);
    console.log(`   - API dashboard: ${productsResponse.ok ? '✅ Accessible' : '❌ Erreur'}`);

    if (eligibleCount > 0 && productsResponse.ok) {
      console.log('\n🎉 SUCCÈS: Le processus complet fonctionne !');
      console.log('   - L\'inscription via simulateur fonctionne');
      console.log('   - La migration des données fonctionne');
      console.log('   - Le dashboard affiche les produits éligibles');
    } else {
      console.log('\n⚠️ ATTENTION: Certains éléments ne fonctionnent pas correctement');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    
    // Nettoyage en cas d'erreur
    if (clientId) {
      console.log('\n🧹 Nettoyage en cas d\'erreur...');
      try {
        await supabase.from('ClientProduitEligible').delete().eq('clientId', clientId);
        await supabase.from('Client').delete().eq('id', clientId);
        console.log('✅ Nettoyage effectué');
      } catch (cleanupError) {
        console.error('❌ Erreur nettoyage:', cleanupError);
      }
    }
    
    process.exit(1);
  }
}

// Exécuter le test
testSimulatorToDashboard();
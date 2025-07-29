// Charger les variables d'environnement
require('dotenv').config({ path: '../.env' });

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_URL = 'https://profitummvp-production.up.railway.app';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debugMigrationDetailed() {
  console.log('🔍 DÉBOGAGE DÉTAILLÉ DE LA MIGRATION');
  console.log('=' .repeat(50));

  try {
    // 1. Récupérer une session avec des éligibilités
    console.log('\n1️⃣ Récupération d\'une session avec éligibilités...');
    
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('TemporarySession')
      .select('*')
      .eq('completed', true)
      .eq('migrated_to_account', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionsError || !sessions || sessions.length === 0) {
      console.error('❌ Aucune session trouvée:', sessionsError);
      return;
    }

    const session = sessions[0];
    console.log('✅ Session trouvée:', {
      id: session.id,
      session_token: session.session_token,
      completed: session.completed,
      migrated_to_account: session.migrated_to_account
    });

    // 2. Vérifier les éligibilités de cette session
    console.log('\n2️⃣ Vérification des éligibilités...');
    
    const { data: eligibilities, error: eligibilitiesError } = await supabaseAdmin
      .from('TemporaryEligibility')
      .select('*')
      .eq('session_id', session.id);

    if (eligibilitiesError) {
      console.error('❌ Erreur récupération éligibilités:', eligibilitiesError);
      return;
    }

    console.log(`✅ ${eligibilities?.length || 0} éligibilités trouvées`);
    
    if (eligibilities && eligibilities.length > 0) {
      console.log('📋 Éligibilités:');
      eligibilities.forEach((elig, index) => {
        console.log(`   ${index + 1}. Produit: ${elig.produit_id}, Score: ${elig.eligibility_score}%, Économies: ${elig.estimated_savings}€`);
      });
    }

    // 3. Vérifier le mapping des produits
    console.log('\n3️⃣ Vérification du mapping des produits...');
    
    const PRODUCT_MAPPING = {
      'TICPE': '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
      'URSSAF': 'd1e8f740-7c2a-4b5e-9a91-0e15c0e7d3a2',
      'DFS': 'e2f9a830-8d3b-4c7c-b590-1d7631c0d4b5',
      'FONCIER': 'c5d2e980-4f63-44c0-b8a9-9d6e8e21c0f7',
      'CIR': '37da1c4e-3fcc-49f8-9acb-9b75e231edfd',
      'CEE': 'b7f3c891-28d9-4982-b0eb-821c9e7cbcf0',
      'AUDIT_ENERGETIQUE': 'bc2b94ec-659b-4cf5-a693-d61178b03caf'
    };

    console.log('📋 Mapping des produits:');
    Object.entries(PRODUCT_MAPPING).forEach(([key, value]) => {
      console.log(`   ${key} → ${value}`);
    });

    // Vérifier si les produits des éligibilités existent dans le mapping
    if (eligibilities && eligibilities.length > 0) {
      console.log('\n🔍 Vérification des produits dans le mapping:');
      eligibilities.forEach((elig, index) => {
        const mappedId = PRODUCT_MAPPING[elig.produit_id];
        console.log(`   ${index + 1}. ${elig.produit_id}: ${mappedId ? '✅ Mappé' : '❌ Non mappé'}`);
      });
    }

    // 4. Créer un client de test
    console.log('\n4️⃣ Création d\'un client de test...');
    
    const timestamp = Date.now();
    const testUserData = {
      username: `debug-test-${timestamp}`,
      email: `debug-test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      company_name: 'Entreprise Debug Test',
      phone_number: '0123456789',
      address: '123 Rue Debug',
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

    // 5. Récupérer le token d'authentification
    console.log('\n5️⃣ Récupération du token d\'authentification...');
    
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

    // 6. Test de migration avec token
    console.log('\n6️⃣ Test de migration avec token...');
    
    const migrationData = {
      sessionToken: session.session_token,
      clientData: {
        email: testUserData.email
      }
    };

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

    // 7. Vérifier les produits éligibles créés
    console.log('\n7️⃣ Vérification des produits éligibles créés...');
    
    const { data: clientProducts, error: clientProductsError } = await supabaseAdmin
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', registerResult.data.id);

    if (clientProductsError) {
      console.error('❌ Erreur récupération produits clients:', clientProductsError);
    } else {
      console.log(`✅ ${clientProducts?.length || 0} produits éligibles créés pour le client`);
      
      if (clientProducts && clientProducts.length > 0) {
        console.log('📋 Produits éligibles créés:');
        clientProducts.forEach((prod, index) => {
          console.log(`   ${index + 1}. Produit: ${prod.produitId}, Statut: ${prod.statut}, Montant: ${prod.montantFinal}€`);
        });
      }
    }

    // 8. Test de l'API produits éligibles
    console.log('\n8️⃣ Test de l\'API produits éligibles...');
    
    const productsResponse = await fetch(`${API_URL}/api/client/produits-eligibles`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📡 Status produits éligibles:', productsResponse.status);
    
    const productsResult = await productsResponse.json();
    console.log('📥 Réponse produits éligibles:', JSON.stringify(productsResult, null, 2));

    // 9. Nettoyage
    console.log('\n9️⃣ Nettoyage...');
    
    // Supprimer le client de test
    const { error: deleteError } = await supabaseAdmin
      .from('Client')
      .delete()
      .eq('email', testUserData.email);

    if (deleteError) {
      console.error('⚠️ Erreur suppression client:', deleteError);
    } else {
      console.log('✅ Client de test supprimé');
    }

    // 10. Résumé final
    console.log('\n📊 RÉSUMÉ FINAL');
    console.log('-'.repeat(30));
    console.log(`   - Session: ${session.session_token}`);
    console.log(`   - Éligibilités: ${eligibilities?.length || 0}`);
    console.log(`   - Migration: ${migrationResponse.status === 200 ? '✅ Succès' : '❌ Échec'}`);
    console.log(`   - Produits créés: ${clientProducts?.length || 0}`);
    console.log(`   - API dashboard: ${productsResponse.status === 200 ? '✅ Succès' : '❌ Échec'}`);

  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error);
  }
}

debugMigrationDetailed(); 
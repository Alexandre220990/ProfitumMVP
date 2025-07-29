// Charger les variables d'environnement
require('dotenv').config({ path: '../.env' });

const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const API_URL = 'https://profitummvp-production.up.railway.app';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMigrationDirect() {
  console.log('🧪 TEST MIGRATION DIRECTE');
  console.log('=' .repeat(40));

  try {
    // 1. Récupérer la dernière session avec éligibilités
    console.log('\n1️⃣ Récupération de la dernière session...');
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('TemporarySession')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionsError || !sessions || sessions.length === 0) {
      console.error('❌ Erreur récupération sessions:', sessionsError);
      return;
    }

    const session = sessions[0];
    console.log('✅ Session trouvée:', {
      id: session.id,
      session_token: session.session_token
    });

    // 2. Vérifier les éligibilités pour cette session
    console.log('\n2️⃣ Vérification des éligibilités...');
    
    const { data: eligibilities, error: eligibilitiesError } = await supabase
      .from('TemporaryEligibility')
      .select('*')
      .eq('session_id', session.id);

    if (eligibilitiesError) {
      console.error('❌ Erreur récupération éligibilités:', eligibilitiesError);
      return;
    }

    console.log(`✅ ${eligibilities?.length || 0} éligibilités trouvées`);
    
    if (!eligibilities || eligibilities.length === 0) {
      console.error('❌ Aucune éligibilité trouvée pour cette session');
      return;
    }

    for (const eligibility of eligibilities) {
      console.log(`   - ${eligibility.produit_id}: ${eligibility.eligibility_score}% (${eligibility.estimated_savings}€)`);
    }

    // 3. Créer un client de test
    console.log('\n3️⃣ Création d\'un client de test...');
    
    const timestamp = Date.now();
    const testUserData = {
      username: `direct-test-${timestamp}`,
      email: `direct-test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      company_name: 'Entreprise Test Direct',
      phone_number: '0123456789',
      address: '123 Rue Test',
      city: 'Paris',
      postal_code: '75001',
      siren: `${timestamp % 1000000000}`.padStart(9, '0'),
      type: 'client'
    };

    // Inscription
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
    const authToken = registerResult.data.token;
    console.log('✅ Inscription réussie');

    // 4. Test de migration directe
    console.log('\n4️⃣ Test de migration directe...');
    
    const migrationData = {
      sessionToken: session.session_token,
      sessionId: session.session_token,
      clientData: testUserData
    };

    console.log('📤 Données envoyées:', {
      sessionToken: session.session_token,
      sessionId: session.id,
      clientEmail: testUserData.email
    });

    const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(migrationData)
    });

    console.log('📡 Status migration:', migrationResponse.status);
    
    const migrationResult = await migrationResponse.json();
    console.log('📥 Réponse migration:', JSON.stringify(migrationResult, null, 2));

    if (migrationResult.success) {
      console.log('✅ Migration réussie !');
      console.log(`   - Produits migrés: ${migrationResult.data.migrated_count || 0}`);
    } else {
      console.log('❌ Migration échouée:', migrationResult.error);
    }

    // 5. Vérification en base
    console.log('\n5️⃣ Vérification en base...');
    
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('id')
      .eq('email', testUserData.email)
      .single();

    if (clientError) {
      console.error('❌ Erreur récupération client:', clientError);
    } else {
      const { data: clientProducts, error: productsError } = await supabase
        .from('ClientProduitEligible')
        .select('*')
        .eq('clientId', client.id);

      if (productsError) {
        console.error('❌ Erreur récupération produits:', productsError);
      } else {
        console.log(`✅ ${clientProducts?.length || 0} produits éligibles créés en base`);
        for (const product of clientProducts || []) {
          console.log(`   - ${product.produitId}: ${product.statut} (${product.montantFinal}€)`);
        }
      }
    }

    // 6. Nettoyage
    console.log('\n6️⃣ Nettoyage...');
    
    if (client) {
      await supabase.from('ClientProduitEligible').delete().eq('clientId', client.id);
      await supabase.from('Client').delete().eq('id', client.id);
      console.log('✅ Nettoyage effectué');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testMigrationDirect();
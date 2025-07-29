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

async function debugMigrationIssue() {
  console.log('🔍 DIAGNOSTIC MIGRATION');
  console.log('=' .repeat(40));

  try {
    // 1. Vérifier les sessions existantes
    console.log('\n1️⃣ Vérification des sessions existantes...');
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('TemporarySession')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.error('❌ Erreur récupération sessions:', sessionsError);
    } else {
      console.log(`✅ ${sessions.length} sessions trouvées:`);
      for (const session of sessions) {
        console.log(`   - ${session.session_token}: ${session.completed ? '✅' : '❌'} completed`);
      }
    }

    // 2. Vérifier les éligibilités existantes
    console.log('\n2️⃣ Vérification des éligibilités existantes...');
    
    const { data: eligibilities, error: eligibilitiesError } = await supabase
      .from('TemporaryEligibility')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (eligibilitiesError) {
      console.error('❌ Erreur récupération éligibilités:', eligibilitiesError);
    } else {
      console.log(`✅ ${eligibilities.length} éligibilités trouvées:`);
      for (const eligibility of eligibilities) {
        console.log(`   - ${eligibility.produit_id}: ${eligibility.eligibility_score}% (${eligibility.estimated_savings}€)`);
      }
    }

    // 3. Vérifier le mapping des produits
    console.log('\n3️⃣ Vérification du mapping des produits...');
    
    const { data: products, error: productsError } = await supabase
      .from('ProduitEligible')
      .select('*');

    if (productsError) {
      console.error('❌ Erreur récupération produits:', productsError);
    } else {
      console.log(`✅ ${products.length} produits trouvés:`);
      for (const product of products) {
        console.log(`   - ${product.nom} (${product.id})`);
      }
    }

    // 4. Tester la migration avec une session existante
    if (sessions && sessions.length > 0) {
      console.log('\n4️⃣ Test de migration avec session existante...');
      
      const testSession = sessions[0];
      console.log(`   - Session test: ${testSession.session_token}`);
      
      // Créer un client de test
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

      // Migration
      const migrationData = {
        sessionToken: testSession.session_token,
        sessionId: testSession.session_token,
        clientData: testUserData
      };

      console.log('📤 Données de migration:', JSON.stringify(migrationData, null, 2));

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
        console.log('✅ Migration réussie');
      } else {
        console.log('❌ Migration échouée:', migrationResult.error);
      }

      // Nettoyage
      await supabase.from('Client').delete().eq('email', testUserData.email);
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  }
}

debugMigrationIssue();
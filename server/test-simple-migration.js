// Test de la migration simplifiée
require('dotenv').config({ path: '../.env' });

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_URL = 'https://profitummvp-production.up.railway.app';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleMigration() {
  console.log('🧪 TEST MIGRATION SIMPLIFIÉE');
  console.log('='.repeat(50));

  try {
    // 1. Créer un client de test
    console.log('\n1️⃣ Création d\'un client de test...');
    
    const timestamp = Date.now();
    const testClientData = {
      email: `test-simple-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Client Test Simple',
      company_name: 'Entreprise Test Simple',
      phone_number: '0123456789',
      address: '123 Rue Test',
      city: 'Paris',
      postal_code: '75001',
      siren: String(Math.floor(100000000 + Math.random() * 900000000)),
      type: 'client',
      statut: 'actif',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: client, error: clientError } = await supabase
      .from('Client')
      .insert(testClientData)
      .select()
      .single();

    if (clientError) {
      throw new Error(`Erreur création client: ${clientError.message}`);
    }

    console.log('✅ Client créé:', client.email);

    // 2. Simuler les résultats du simulateur
    console.log('\n2️⃣ Simulation des résultats du simulateur...');
    
    const simulationResults = {
      timestamp: Date.now(),
      products: [
        {
          code: 'TICPE',
          score: 85,
          savings: 5000,
          confidence: 'high'
        },
        {
          code: 'URSSAF',
          score: 70,
          savings: 3000,
          confidence: 'medium'
        },
        {
          code: 'DFS',
          score: 90,
          savings: 8000,
          confidence: 'high'
        }
      ]
    };

    console.log('✅ Résultats simulés:', simulationResults.products.length, 'produits');

    // 3. Appeler la migration simplifiée
    console.log('\n3️⃣ Migration des résultats...');
    
    const migrationResponse = await fetch(`${API_URL}/api/simple-migration/migrate-simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientId: client.id,
        email: client.email,
        simulationResults: simulationResults
      })
    });

    const migrationResult = await migrationResponse.json();
    
    if (migrationResult.success) {
      console.log('✅ Migration réussie');
      console.log(`   - Produits migrés: ${migrationResult.data.migrated_products}`);
    } else {
      console.error('❌ Migration échouée:', migrationResult.error);
      return;
    }

    // 4. Vérifier les produits en base
    console.log('\n4️⃣ Vérification en base...');
    
    const { data: clientProducts, error: dbError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible (
          id,
          nom,
          description,
          category
        )
      `)
      .eq('clientId', client.id);

    if (dbError) {
      console.error('❌ Erreur vérification:', dbError);
    } else {
      console.log(`✅ ${clientProducts.length} produits trouvés en base:`);
      for (const product of clientProducts) {
        console.log(`   - ${product.ProduitEligible?.nom || product.produitId}: ${product.statut} (${product.montantFinal}€)`);
      }
    }

    // 5. Test de l'API de récupération
    console.log('\n5️⃣ Test API récupération produits...');
    
    const productsResponse = await fetch(`${API_URL}/api/simple-migration/client-products/${client.id}`);
    const productsResult = await productsResponse.json();
    
    if (productsResult.success) {
      console.log('✅ API fonctionne');
      console.log(`   - Produits récupérés: ${productsResult.data.products.length}`);
    } else {
      console.error('❌ Erreur API:', productsResult.error);
    }

    console.log('\n🎉 Test terminé avec succès !');
    console.log(`📧 Client de test: ${client.email}`);

  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}

testSimpleMigration(); 
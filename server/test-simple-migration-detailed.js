// Test détaillé de la migration simplifiée
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

async function testSimpleMigrationDetailed() {
  console.log('🧪 TEST MIGRATION SIMPLIFIÉE DÉTAILLÉ');
  console.log('='.repeat(60));

  try {
    // 1. Créer un client de test
    console.log('\n1️⃣ Création d\'un client de test...');
    
    const timestamp = Date.now();
    const testClientData = {
      email: `test-detailed-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Client Test Détaillé',
      company_name: 'Entreprise Test Détaillé',
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
    console.log('   ID:', client.id);

    // 2. Vérifier les produits éligibles existants
    console.log('\n2️⃣ Vérification des produits éligibles en base...');
    
    const { data: produitsEligibles, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('id, nom, categorie')
      .limit(10);

    if (produitsError) {
      console.error('❌ Erreur récupération produits:', produitsError);
    } else {
      console.log('✅ Produits éligibles en base:');
      for (const produit of produitsEligibles) {
        console.log(`   - ${produit.nom}: ${produit.categorie} (${produit.id})`);
      }
    }

    // 3. Simuler les résultats du simulateur avec les vrais noms de produits
    console.log('\n3️⃣ Simulation des résultats du simulateur...');
    
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

    console.log('✅ Résultats simulés:');
    for (const product of simulationResults.products) {
      console.log(`   - ${product.code}: Score ${product.score}%, Économies ${product.savings}€`);
    }

    // 4. Appeler la migration simplifiée
    console.log('\n4️⃣ Migration des résultats...');
    
    const migrationPayload = {
      clientId: client.id,
      email: client.email,
      simulationResults: simulationResults
    };

    console.log('📤 Payload envoyé:', JSON.stringify(migrationPayload, null, 2));
    
    const migrationResponse = await fetch(`${API_URL}/api/simple-migration/migrate-simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(migrationPayload)
    });

    console.log('📥 Status:', migrationResponse.status);
    
    const migrationResult = await migrationResponse.json();
    console.log('📥 Réponse:', JSON.stringify(migrationResult, null, 2));
    
    if (migrationResult.success) {
      console.log('✅ Migration réussie');
      console.log(`   - Produits migrés: ${migrationResult.data.migrated_products}`);
    } else {
      console.error('❌ Migration échouée:', migrationResult.error);
      return;
    }

    // 5. Vérifier les produits en base
    console.log('\n5️⃣ Vérification en base...');
    
    const { data: clientProducts, error: dbError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible (
          id,
          nom,
          description,
          categorie
        )
      `)
      .eq('clientId', client.id);

    if (dbError) {
      console.error('❌ Erreur vérification:', dbError);
    } else {
      console.log(`✅ ${clientProducts.length} produits trouvés en base:`);
      for (const product of clientProducts) {
        console.log(`   - ${product.ProduitEligible?.nom || product.produitId}: ${product.statut} (${product.montantFinal}€)`);
        console.log(`     Score: ${product.tauxFinal * 100}%, Priorité: ${product.priorite}`);
      }
    }

    // 6. Test de l'API de récupération
    console.log('\n6️⃣ Test API récupération produits...');
    
    const productsResponse = await fetch(`${API_URL}/api/simple-migration/client-products/${client.id}`);
    const productsResult = await productsResponse.json();
    
    if (productsResult.success) {
      console.log('✅ API fonctionne');
      console.log(`   - Produits récupérés: ${productsResult.data.products.length}`);
    } else {
      console.error('❌ Erreur API:', productsResult.error);
    }

    // 7. Nettoyage
    console.log('\n7️⃣ Nettoyage des données de test...');
    
    // Supprimer les produits éligibles du client de test
    await supabase
      .from('ClientProduitEligible')
      .delete()
      .eq('clientId', client.id);

    // Supprimer le client de test
    await supabase
      .from('Client')
      .delete()
      .eq('id', client.id);

    console.log('✅ Données de test nettoyées');

    console.log('\n🎉 Test terminé avec succès !');
    console.log(`📧 Client de test: ${client.email}`);

  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}

testSimpleMigrationDetailed(); 
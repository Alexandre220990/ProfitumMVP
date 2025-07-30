// Test de la migration refactorisée
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

async function testRefactoredMigration() {
  console.log('🧪 TEST MIGRATION REFACTORISÉE');
  console.log('='.repeat(50));

  try {
    // 1. Vérifier le mapping des produits
    console.log('\n1️⃣ Vérification du mapping des produits...');
    
    const mappingResponse = await fetch(`${API_URL}/api/simple-migration/debug/mapping`);
    const mappingResult = await mappingResponse.json();
    
    if (mappingResult.success) {
      console.log('✅ Mapping récupéré:');
      console.log('   - Clés mappées:', mappingResult.data.mapping_keys);
      console.log('   - Mapping complet:', mappingResult.data.mapping);
    } else {
      console.error('❌ Erreur récupération mapping:', mappingResult.error);
    }

    // 2. Créer un client de test
    console.log('\n2️⃣ Création d\'un client de test...');
    
    const timestamp = Date.now();
    const testClientData = {
      email: `test-refactored-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Client Test Refactorisé',
      company_name: 'Entreprise Test Refactorisé',
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

    // 3. Test de la migration avec des produits valides
    console.log('\n3️⃣ Test de la migration...');
    
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

    const migrationPayload = {
      clientId: client.id,
      email: client.email,
      simulationResults: simulationResults
    };

    console.log('📤 Payload migration:', JSON.stringify(migrationPayload, null, 2));
    
    const migrationResponse = await fetch(`${API_URL}/api/simple-migration/migrate-simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(migrationPayload)
    });

    console.log('📥 Status migration:', migrationResponse.status);
    
    const migrationResult = await migrationResponse.json();
    console.log('📥 Réponse migration:', JSON.stringify(migrationResult, null, 2));
    
    if (migrationResult.success) {
      console.log('✅ Migration réussie');
      console.log(`   - Produits migrés: ${migrationResult.data.migrated_products}`);
      if (migrationResult.data.errors && migrationResult.data.errors.length > 0) {
        console.log('   - Erreurs:', migrationResult.data.errors);
      }
    } else {
      console.error('❌ Migration échouée:', migrationResult.error);
      if (migrationResult.details) {
        console.error('   - Détails:', migrationResult.details);
      }
    }

    // 4. Vérification en base
    console.log('\n4️⃣ Vérification en base...');
    
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
        console.log(`     Métadonnées:`, product.metadata);
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

    // 6. Test avec un produit non mappé
    console.log('\n6️⃣ Test avec produit non mappé...');
    
    const invalidSimulationResults = {
      timestamp: Date.now(),
      products: [
        {
          code: 'PRODUIT_INEXISTANT',
          score: 50,
          savings: 1000,
          confidence: 'low'
        }
      ]
    };

    const invalidMigrationPayload = {
      clientId: client.id,
      email: client.email,
      simulationResults: invalidSimulationResults
    };

    const invalidMigrationResponse = await fetch(`${API_URL}/api/simple-migration/migrate-simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidMigrationPayload)
    });

    const invalidMigrationResult = await invalidMigrationResponse.json();
    console.log('📥 Réponse migration invalide:', JSON.stringify(invalidMigrationResult, null, 2));

    // 7. Nettoyage
    console.log('\n7️⃣ Nettoyage...');
    
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

testRefactoredMigration(); 
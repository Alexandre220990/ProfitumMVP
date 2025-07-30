// Test de migration avec structure corrigée et logs détaillés
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

async function testMigrationWithFixedStructure() {
  console.log('🧪 TEST MIGRATION AVEC STRUCTURE CORRIGÉE');
  console.log('='.repeat(60));

  try {
    // 1. Vérifier la structure de la table ClientProduitEligible
    console.log('\n1️⃣ Vérification de la structure ClientProduitEligible...');
    
    // Test d'insertion directe pour vérifier la structure
    const testInsert = {
      clientId: '00000000-0000-0000-0000-000000000000',
      produitId: '00000000-0000-0000-0000-000000000000',
      statut: 'eligible',
      tauxFinal: 0.85,
      montantFinal: 5000,
      dureeFinale: 12,
      simulationId: null,
      metadata: { test: true },
      notes: 'Test structure',
      priorite: 1,
      dateEligibilite: new Date().toISOString(),
      current_step: 0,
      progress: 0,
      expert_id: null,
      charte_signed: false,
      charte_signed_at: null
    };

    console.log('📋 Structure attendue:', Object.keys(testInsert));

    // 2. Créer un client de test
    console.log('\n2️⃣ Création d\'un client de test...');
    
    const timestamp = Date.now();
    const testClientData = {
      email: `test-fixed-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Client Test Structure Fixée',
      company_name: 'Entreprise Test Structure Fixée',
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

    // 3. Vérifier les produits éligibles
    console.log('\n3️⃣ Vérification des produits éligibles...');
    
    const { data: produits, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('id, nom, categorie')
      .limit(5);

    if (produitsError) {
      console.error('❌ Erreur récupération produits:', produitsError);
    } else {
      console.log('✅ Produits disponibles:');
      for (const produit of produits) {
        console.log(`   - ${produit.nom}: ${produit.id}`);
      }
    }

    // 4. Test d'insertion directe en base
    console.log('\n4️⃣ Test d\'insertion directe en base...');
    
    const testProduct = produits[0]; // Utiliser le premier produit disponible
    if (testProduct) {
      const directInsert = {
        clientId: client.id,
        produitId: testProduct.id,
        statut: 'eligible',
        tauxFinal: 0.85,
        montantFinal: 5000,
        dureeFinale: 12,
        simulationId: null,
        metadata: { test: 'direct_insert', source: 'test_script' },
        notes: 'Test insertion directe',
        priorite: 1,
        dateEligibilite: new Date().toISOString(),
        current_step: 0,
        progress: 0,
        expert_id: null,
        charte_signed: false,
        charte_signed_at: null
      };

      console.log('📤 Tentative d\'insertion directe:', JSON.stringify(directInsert, null, 2));
      
      const { data: insertedDirect, error: insertDirectError } = await supabase
        .from('ClientProduitEligible')
        .insert(directInsert)
        .select()
        .single();

      if (insertDirectError) {
        console.error('❌ Erreur insertion directe:', insertDirectError);
      } else {
        console.log('✅ Insertion directe réussie:', insertedDirect.id);
        
        // Nettoyer l'insertion de test
        await supabase
          .from('ClientProduitEligible')
          .delete()
          .eq('id', insertedDirect.id);
        console.log('🧹 Insertion de test nettoyée');
      }
    }

    // 5. Test de la migration via API
    console.log('\n5️⃣ Test de la migration via API...');
    
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
    } else {
      console.error('❌ Migration échouée:', migrationResult.error);
    }

    // 6. Vérification finale
    console.log('\n6️⃣ Vérification finale...');
    
    const { data: finalProducts, error: finalError } = await supabase
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

    if (finalError) {
      console.error('❌ Erreur vérification finale:', finalError);
    } else {
      console.log(`✅ ${finalProducts.length} produits trouvés en base:`);
      for (const product of finalProducts) {
        console.log(`   - ${product.ProduitEligible?.nom || product.produitId}: ${product.statut} (${product.montantFinal}€)`);
        console.log(`     Score: ${product.tauxFinal * 100}%, Priorité: ${product.priorite}`);
      }
    }

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

    console.log('\n🎉 Test terminé !');
    console.log(`📧 Client de test: ${client.email}`);

  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}

testMigrationWithFixedStructure(); 
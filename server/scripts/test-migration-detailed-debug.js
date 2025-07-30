// Test détaillé de la migration avec debug complet
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

async function testMigrationDetailedDebug() {
  console.log('🔍 TEST MIGRATION DÉTAILLÉ AVEC DEBUG');
  console.log('='.repeat(50));

  try {
    // 1. Créer un client de test
    console.log('\n1️⃣ Création d\'un client de test...');
    
    const timestamp = Date.now();
    const testClientData = {
      email: `debug-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Client Debug',
      company_name: 'Entreprise Debug',
      phone_number: '0123456789',
      address: '123 Rue Debug',
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
    console.log('   Type ID:', typeof client.id);

    // 2. Simuler exactement ce que fait l'API
    console.log('\n2️⃣ Simulation de la logique API...');
    
    // Vérifier que le client existe (comme dans l'API)
    console.log('🔍 Vérification du client (comme dans l\'API)...');
    const { data: clientCheck, error: clientCheckError } = await supabase
      .from('Client')
      .select('id, email')
      .eq('id', client.id)
      .eq('email', client.email)
      .single();

    if (clientCheckError || !clientCheck) {
      console.error('❌ Client non trouvé lors de la vérification:', clientCheckError);
      return;
    }

    console.log('✅ Client vérifié avec succès:', clientCheck);
    console.log('✅ Client ID récupéré:', clientCheck.id);
    console.log('✅ Type clientCheck.id:', typeof clientCheck.id);

    // 3. Test d'insertion avec les mêmes données que l'API
    console.log('\n3️⃣ Test d\'insertion avec les données API...');
    
    // Récupérer un produit éligible
    const { data: produits, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('id, nom')
      .limit(1);

    if (produitsError || !produits || produits.length === 0) {
      console.error('❌ Aucun produit éligible trouvé:', produitsError);
      return;
    }

    const produitId = produits[0].id;
    console.log('✅ Produit sélectionné:', produits[0].nom, '(', produitId, ')');

    // Créer les données exactement comme dans l'API
    const testProduct = {
      code: 'TICPE',
      score: 85,
      savings: 5000,
      confidence: 'high'
    };

    const clientProduitEligible = {
      clientId: clientCheck.id, // Utiliser clientCheck.id comme dans l'API
      produitId: produitId,
      statut: testProduct.score >= 50 ? 'eligible' : 'non_eligible',
      tauxFinal: testProduct.score / 100,
      montantFinal: testProduct.savings || 0,
      dureeFinale: 12,
      simulationId: null,
      sessionId: null,
      metadata: {
        original_code: testProduct.code,
        migrated_at: new Date().toISOString(),
        source: 'simulator',
        confidence: testProduct.confidence,
        original_score: testProduct.score
      },
      notes: `Migration depuis simulateur - Score: ${testProduct.score}%`,
      priorite: testProduct.score >= 80 ? 1 : testProduct.score >= 60 ? 2 : 3,
      dateEligibilite: new Date().toISOString(),
      current_step: 0,
      progress: 0,
      expert_id: null,
      charte_signed: false,
      charte_signed_at: null
    };

    console.log('📤 Données à insérer (comme dans l\'API):');
    console.log(JSON.stringify(clientProduitEligible, null, 2));

    console.log('🔍 Vérification des données avant insertion:');
    console.log(`   * clientId: ${clientProduitEligible.clientId} (type: ${typeof clientProduitEligible.clientId})`);
    console.log(`   * produitId: ${clientProduitEligible.produitId} (type: ${typeof clientProduitEligible.produitId})`);
    console.log(`   * statut: ${clientProduitEligible.statut}`);
    console.log(`   * tauxFinal: ${clientProduitEligible.tauxFinal}`);
    console.log(`   * montantFinal: ${clientProduitEligible.montantFinal}`);
    console.log(`   * sessionId: ${clientProduitEligible.sessionId}`);

    // Insérer dans la base
    const { data: insertedData, error: insertError } = await supabase
      .from('ClientProduitEligible')
      .insert(clientProduitEligible)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erreur insertion:', insertError);
      console.error('❌ Détails de l\'erreur:', JSON.stringify(insertError, null, 2));
      console.error('❌ Données qui ont causé l\'erreur:', JSON.stringify(clientProduitEligible, null, 2));
    } else {
      console.log('✅ Insertion réussie:', insertedData);
    }

    // 4. Test de l'API réelle
    console.log('\n4️⃣ Test de l\'API réelle...');
    
    const simulationResults = {
      timestamp: Date.now(),
      products: [
        {
          code: 'TICPE',
          score: 85,
          savings: 5000,
          confidence: 'high'
        }
      ]
    };

    const migrationPayload = {
      clientId: client.id,
      email: client.email,
      simulationResults: simulationResults
    };

    console.log('📤 Payload API:', JSON.stringify(migrationPayload, null, 2));
    
    const migrationResponse = await fetch(`${API_URL}/api/simple-migration/migrate-simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(migrationPayload)
    });

    console.log('📥 Status API:', migrationResponse.status);
    
    const migrationResult = await migrationResponse.json();
    console.log('📥 Réponse API:', JSON.stringify(migrationResult, null, 2));

    // 5. Nettoyage
    console.log('\n5️⃣ Nettoyage...');
    
    if (insertedData) {
      const { error: deleteError } = await supabase
        .from('ClientProduitEligible')
        .delete()
        .eq('id', insertedData.id);
      
      if (deleteError) {
        console.error('⚠️ Erreur suppression test:', deleteError);
      } else {
        console.log('✅ Données de test supprimées');
      }
    }

    const { error: deleteClientError } = await supabase
      .from('Client')
      .delete()
      .eq('id', client.id);
    
    if (deleteClientError) {
      console.error('⚠️ Erreur suppression client:', deleteClientError);
    } else {
      console.log('✅ Client de test supprimé');
    }

  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}

testMigrationDetailedDebug(); 
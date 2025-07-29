// Charger les variables d'environnement
require('dotenv').config({ path: '../../.env' });

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.error('SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapping des produits (copié du serveur)
const PRODUCT_MAPPING = {
  'TICPE': '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
  'URSSAF': 'd1e8f740-7c2a-4b5e-9a91-0e15c0e7d3a2',
  'DFS': 'e2f9a830-8d3b-4c7c-b590-1d7631c0d4b5',
  'FONCIER': 'c5d2e980-4f63-44c0-b8a9-9d6e8e21c0f7',
  'CIR': '37da1c4e-3fcc-49f8-9acb-9b75e231edfd',
  'CEE': 'b7f3c891-28d9-4982-b0eb-821c9e7cbcf0',
  'AUDIT_ENERGETIQUE': 'bc2b94ec-659b-4cf5-a693-d61178b03caf'
};

async function testMigrationProcess() {
  console.log('🧪 Test du processus de migration complet\n');

  try {
    // 1. Créer une session temporaire de test
    console.log('1️⃣ Création d\'une session temporaire de test...');
    
    const sessionToken = crypto.randomUUID();
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

    console.log('✅ Session temporaire créée:', sessionToken);

    // 2. Créer des résultats d'éligibilité de test
    console.log('\n2️⃣ Création des résultats d\'éligibilité de test...');
    
    const testEligibilityResults = [
      {
        session_id: session.id,
        produit_id: 'TICPE',
        eligibility_score: 85,
        estimated_savings: 5000,
        confidence_level: 'high',
        recommendations: ['Test recommandation 1', 'Test recommandation 2'],
        created_at: new Date().toISOString()
      },
      {
        session_id: session.id,
        produit_id: 'URSSAF',
        eligibility_score: 70,
        estimated_savings: 3000,
        confidence_level: 'medium',
        recommendations: ['Test recommandation URSSAF'],
        created_at: new Date().toISOString()
      }
    ];

    const { data: eligibilityResults, error: eligibilityError } = await supabase
      .from('TemporaryEligibility')
      .insert(testEligibilityResults)
      .select();

    if (eligibilityError) {
      throw new Error(`Erreur création éligibilité: ${eligibilityError.message}`);
    }

    console.log(`✅ ${eligibilityResults.length} résultats d'éligibilité créés`);

    // 3. Créer un client de test
    console.log('\n3️⃣ Création d\'un client de test...');
    
    const testClientData = {
      email: `test-migration-${Date.now()}@example.com`,
      username: `test-user-${Date.now()}`,
      password: 'test-password-123', // Ajout du mot de passe requis
      company_name: 'Entreprise Test Migration',
      siren: `${Date.now() % 1000000000}`.padStart(9, '0'), // SIREN unique de 9 chiffres
      phone_number: '0123456789',
      address: '123 Rue Test',
      city: 'Paris',
      postal_code: '75001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString() // Ajout du champ updated_at requis
    };

    const { data: client, error: clientError } = await supabase
      .from('Client')
      .insert(testClientData)
      .select()
      .single();

    if (clientError) {
      throw new Error(`Erreur création client: ${clientError.message}`);
    }

    console.log('✅ Client de test créé:', client.email);

    // 4. Tester la migration manuelle
    console.log('\n4️⃣ Test de migration manuelle...');
    
    const clientProduitsEligibles = [];

    for (const result of eligibilityResults) {
      console.log(`🔍 Traitement du produit: ${result.produit_id} (${result.estimated_savings}€)`);
      
      const produitId = PRODUCT_MAPPING[result.produit_id];
      
      if (!produitId) {
        console.warn(`⚠️ Produit non trouvé dans le mapping: ${result.produit_id}`);
        continue;
      }

      const clientProduitEligible = {
        clientId: client.id,
        produitId: produitId,
        statut: result.eligibility_score >= 50 ? 'eligible' : 'non_eligible',
        tauxFinal: result.eligibility_score / 100,
        montantFinal: result.estimated_savings || 0,
        dureeFinale: 12,
        simulationId: null,
        metadata: {
          confidence_level: result.confidence_level,
          recommendations: result.recommendations || [],
          session_token: sessionToken,
          migrated_at: new Date().toISOString(),
          original_produit_id: result.produit_id,
          test_migration: true
        },
        notes: `Test migration - Score: ${result.eligibility_score}%, Confiance: ${result.confidence_level}`,
        priorite: result.eligibility_score >= 80 ? 1 : result.eligibility_score >= 60 ? 2 : 3,
        dateEligibilite: new Date().toISOString(),
        current_step: 0,
        progress: 0,
        expert_id: null,
        charte_signed: false,
        charte_signed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      clientProduitsEligibles.push(clientProduitEligible);
    }

    // 5. Insérer les ClientProduitEligible
    console.log('\n5️⃣ Insertion des ClientProduitEligible...');
    
    if (clientProduitsEligibles.length > 0) {
      const { data: insertedProducts, error: insertError } = await supabase
        .from('ClientProduitEligible')
        .insert(clientProduitsEligibles)
        .select();

      if (insertError) {
        console.error('❌ Erreur insertion ClientProduitEligible:', insertError);
        console.error('📋 Détails erreur:', JSON.stringify(insertError, null, 2));
        console.error('📤 Données envoyées:', JSON.stringify(clientProduitsEligibles, null, 2));
        throw new Error(`Erreur insertion: ${insertError.message}`);
      }

      console.log(`✅ ${insertedProducts.length} produits éligibles créés`);
      
      // 6. Vérifier les produits créés
      console.log('\n6️⃣ Vérification des produits créés...');
      
      for (const product of insertedProducts) {
        console.log(`  - ${product.produitId}: ${product.statut} (${product.montantFinal}€)`);
      }
    }

    // 7. Marquer la session comme migrée
    console.log('\n7️⃣ Marquage de la session comme migrée...');
    
    const { error: updateError } = await supabase
      .from('TemporarySession')
      .update({
        migrated_to_account: true,
        migrated_at: new Date().toISOString(),
        client_id: client.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('⚠️ Erreur marquage session:', updateError);
    } else {
      console.log('✅ Session marquée comme migrée');
    }

    // 8. Vérification finale
    console.log('\n8️⃣ Vérification finale...');
    
    const { data: finalProducts, error: finalError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible (
          id,
          nom,
          categorie
        )
      `)
      .eq('clientId', client.id);

    if (finalError) {
      console.error('❌ Erreur vérification finale:', finalError);
    } else {
      console.log(`✅ Vérification finale: ${finalProducts.length} produits trouvés`);
      for (const product of finalProducts) {
        console.log(`  - ${product.ProduitEligible?.nom || product.produitId}: ${product.statut} (${product.montantFinal}€)`);
      }
    }

    console.log('\n🎉 Test de migration réussi !');
    console.log(`📊 Résumé:`);
    console.log(`  - Session: ${sessionToken}`);
    console.log(`  - Client: ${client.email}`);
    console.log(`  - Produits créés: ${clientProduitsEligibles.length}`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  }
}

// Exécuter le test
testMigrationProcess();
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

async function debugMigrationDatabase() {
  console.log('🔍 DÉBOGAGE DÉTAILLÉ BASE DE DONNÉES MIGRATION');
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
        console.log(`   ${index + 1}. ID: ${elig.id}, Produit: ${elig.produit_id}, Score: ${elig.eligibility_score}%, Économies: ${elig.estimated_savings}€`);
        console.log(`      Session ID: ${elig.session_id}, Created: ${elig.created_at}`);
      });
    }

    // 3. Créer un client de test
    console.log('\n3️⃣ Création d\'un client de test...');
    
    const timestamp = Date.now();
    const testUserData = {
      username: `db-debug-${timestamp}`,
      email: `db-debug-${timestamp}@example.com`,
      password: 'TestPassword123!',
      company_name: 'Entreprise DB Debug',
      phone_number: '0123456789',
      address: '123 Rue DB Debug',
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
    console.log('📋 Détails client:', {
      id: registerResult.data.id,
      email: registerResult.data.email,
      company_name: registerResult.data.company_name
    });

    // 4. Vérifier que le client existe bien en base
    console.log('\n4️⃣ Vérification du client en base...');
    
    const { data: clientInDb, error: clientError } = await supabaseAdmin
      .from('Client')
      .select('*')
      .eq('email', testUserData.email)
      .single();

    if (clientError) {
      console.error('❌ Erreur récupération client:', clientError);
      return;
    }

    console.log('✅ Client trouvé en base:', {
      id: clientInDb.id,
      email: clientInDb.email,
      company_name: clientInDb.company_name,
      created_at: clientInDb.created_at,
      updated_at: clientInDb.updated_at
    });

    // 5. Simuler la logique de migration manuellement
    console.log('\n5️⃣ Simulation manuelle de la migration...');
    
    // Récupérer les éligibilités avec supabaseAdmin
    console.log('🔍 Récupération des éligibilités avec supabaseAdmin...');
    
    const { data: dbEligibilityResults, error: eligibilityError } = await supabaseAdmin
      .from('TemporaryEligibility')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (eligibilityError) {
      console.error('❌ Erreur récupération éligibilités avec supabaseAdmin:', eligibilityError);
      return;
    }

    console.log(`✅ ${dbEligibilityResults?.length || 0} éligibilités récupérées avec supabaseAdmin`);
    
    if (dbEligibilityResults && dbEligibilityResults.length > 0) {
      console.log('📋 Éligibilités récupérées:');
      dbEligibilityResults.forEach((elig, index) => {
        console.log(`   ${index + 1}. ID: ${elig.id}, Produit: ${elig.produit_id}, Score: ${elig.eligibility_score}%`);
      });
    }

    // 6. Vérifier le mapping des produits
    console.log('\n6️⃣ Vérification du mapping des produits...');
    
    const PRODUCT_MAPPING = {
      'TICPE': '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
      'URSSAF': 'd1e8f740-7c2a-4b5e-9a91-0e15c0e7d3a2',
      'DFS': 'e2f9a830-8d3b-4c7c-b590-1d7631c0d4b5',
      'FONCIER': 'c5d2e980-4f63-44c0-b8a9-9d6e8e21c0f7',
      'CIR': '37da1c4e-3fcc-49f8-9acb-9b75e231edfd',
      'CEE': 'b7f3c891-28d9-4982-b0eb-821c9e7cbcf0',
      'AUDIT_ENERGETIQUE': 'bc2b94ec-659b-4cf5-a693-d61178b03caf'
    };

    // Vérifier si les produits existent dans ProduitEligible
    console.log('🔍 Vérification des produits dans ProduitEligible...');
    
    const { data: products, error: productsError } = await supabaseAdmin
      .from('ProduitEligible')
      .select('id, nom');

    if (productsError) {
      console.error('❌ Erreur récupération produits:', productsError);
      return;
    }

    console.log(`✅ ${products?.length || 0} produits dans le catalogue`);
    
    if (dbEligibilityResults && dbEligibilityResults.length > 0) {
      console.log('📋 Mapping des produits des éligibilités:');
      dbEligibilityResults.forEach((elig, index) => {
        const mappedId = PRODUCT_MAPPING[elig.produit_id];
        const productExists = products?.some(p => p.id === mappedId);
        const productName = products?.find(p => p.id === mappedId)?.nom || 'Inconnu';
        
        console.log(`   ${index + 1}. ${elig.produit_id} → ${mappedId} (${productName}) ${productExists ? '✅' : '❌'}`);
      });
    }

    // 7. Créer manuellement les ClientProduitEligible
    console.log('\n7️⃣ Création manuelle des ClientProduitEligible...');
    
    const clientProduitsEligibles = [];
    
    if (dbEligibilityResults && dbEligibilityResults.length > 0) {
      for (const result of dbEligibilityResults) {
        console.log(`🔍 Traitement du produit: ${result.produit_id} (${result.estimated_savings}€)`);
        
        const produitId = result.produit_id && typeof result.produit_id === 'string' 
          ? PRODUCT_MAPPING[result.produit_id] 
          : undefined;
        
        if (!produitId) {
          console.warn(`⚠️ Produit non trouvé dans le mapping: ${result.produit_id}`);
          continue;
        }

        const clientProduitEligible = {
          clientId: clientInDb.id,
          produitId: produitId,
          statut: result.eligibility_score >= 50 ? 'eligible' : 'non_eligible',
          tauxFinal: result.eligibility_score / 100,
          montantFinal: result.estimated_savings || 0,
          dureeFinale: 12,
          simulationId: null,
          metadata: {
            confidence_level: result.confidence_level,
            recommendations: result.recommendations || [],
            session_token: session.session_token,
            migrated_at: new Date().toISOString(),
            original_produit_id: result.produit_id
          },
          notes: `Migration manuelle depuis simulateur - Score: ${result.eligibility_score}%, Confiance: ${result.confidence_level}`,
          priorite: result.eligibility_score >= 80 ? 1 : result.eligibility_score >= 60 ? 2 : 3,
          dateEligibilite: new Date().toISOString(),
          current_step: 0,
          progress: 0,
          expert_id: null,
          charte_signed: false,
          charte_signed_at: null
        };

        clientProduitsEligibles.push(clientProduitEligible);
        console.log(`✅ Produit préparé: ${result.produit_id} → ${produitId}`);
      }
    }

    // 8. Insérer les ClientProduitEligible
    console.log('\n8️⃣ Insertion des ClientProduitEligible...');
    
    if (clientProduitsEligibles.length > 0) {
      console.log(`📤 Insertion de ${clientProduitsEligibles.length} produits éligibles...`);
      
      const { data: insertedProducts, error: insertError } = await supabaseAdmin
        .from('ClientProduitEligible')
        .insert(clientProduitsEligibles)
        .select();

      if (insertError) {
        console.error('❌ Erreur insertion ClientProduitEligible:', insertError);
        console.error('📋 Détails erreur:', JSON.stringify(insertError, null, 2));
        console.error('📤 Données envoyées:', JSON.stringify(clientProduitsEligibles, null, 2));
      } else {
        console.log(`✅ ${insertedProducts?.length || 0} produits éligibles créés`);
        
        if (insertedProducts && insertedProducts.length > 0) {
          console.log('📋 Produits créés:');
          insertedProducts.forEach((prod, index) => {
            console.log(`   ${index + 1}. ID: ${prod.id}, Client: ${prod.clientId}, Produit: ${prod.produitId}, Statut: ${prod.statut}`);
          });
        }
      }
    } else {
      console.log('⚠️ Aucun produit à insérer');
    }

    // 9. Marquer la session comme migrée
    console.log('\n9️⃣ Marquage de la session comme migrée...');
    
    const { error: updateError } = await supabaseAdmin
      .from('TemporarySession')
      .update({
        migrated_to_account: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('❌ Erreur marquage session:', updateError);
    } else {
      console.log('✅ Session marquée comme migrée');
    }

    // 10. Vérification finale
    console.log('\n10️⃣ Vérification finale...');
    
    const { data: finalProducts, error: finalError } = await supabaseAdmin
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', clientInDb.id);

    if (finalError) {
      console.error('❌ Erreur vérification finale:', finalError);
    } else {
      console.log(`✅ ${finalProducts?.length || 0} produits éligibles finaux pour le client`);
    }

    // 11. Nettoyage
    console.log('\n11️⃣ Nettoyage...');
    
    // Supprimer les produits éligibles créés
    if (finalProducts && finalProducts.length > 0) {
      const { error: deleteProductsError } = await supabaseAdmin
        .from('ClientProduitEligible')
        .delete()
        .eq('clientId', clientInDb.id);

      if (deleteProductsError) {
        console.error('⚠️ Erreur suppression produits:', deleteProductsError);
      } else {
        console.log('✅ Produits éligibles supprimés');
      }
    }

    // Supprimer le client
    const { error: deleteClientError } = await supabaseAdmin
      .from('Client')
      .delete()
      .eq('id', clientInDb.id);

    if (deleteClientError) {
      console.error('⚠️ Erreur suppression client:', deleteClientError);
    } else {
      console.log('✅ Client supprimé');
    }

    // Remettre la session comme non migrée
    const { error: resetSessionError } = await supabaseAdmin
      .from('TemporarySession')
      .update({
        migrated_to_account: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (resetSessionError) {
      console.error('⚠️ Erreur reset session:', resetSessionError);
    } else {
      console.log('✅ Session remise comme non migrée');
    }

    // 12. Résumé final
    console.log('\n📊 RÉSUMÉ FINAL');
    console.log('-'.repeat(30));
    console.log(`   - Session: ${session.session_token}`);
    console.log(`   - Éligibilités: ${dbEligibilityResults?.length || 0}`);
    console.log(`   - Client créé: ${clientInDb.id}`);
    console.log(`   - Produits créés: ${finalProducts?.length || 0}`);
    console.log(`   - Migration manuelle: ${finalProducts && finalProducts.length > 0 ? '✅ Succès' : '❌ Échec'}`);

  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error);
  }
}

debugMigrationDatabase();
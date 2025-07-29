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

async function testApiLogicManual() {
  console.log('🔍 TEST LOGIQUE API AVEC SUPABASEADMIN PARTOUT');
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

    // 2. Créer un client de test
    console.log('\n2️⃣ Création d\'un client de test...');
    
    const timestamp = Date.now();
    const testUserData = {
      username: `api-logic-${timestamp}`,
      email: `api-logic-${timestamp}@example.com`,
      password: 'TestPassword123!',
      company_name: 'Entreprise API Logic',
      phone_number: '0123456789',
      address: '123 Rue API Logic',
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

    // 3. Simuler exactement la logique de l'API
    console.log('\n3️⃣ Simulation de la logique de l\'API...');
    
    // Étape 1: Validation des paramètres
    const sessionToken = session.session_token;
    const clientData = { email: testUserData.email };
    
    console.log('✅ Validation des paramètres réussie');

    // Étape 2: Récupération de la session avec supabaseAdmin
    console.log('🔍 Étape 1: Récupération de la session...');
    
    const { data: sessionFromDb, error: sessionError } = await supabaseAdmin
      .from('TemporarySession')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (sessionError || !sessionFromDb) {
      console.log('❌ Session non trouvée:', sessionToken);
      return;
    }

    console.log('✅ Session trouvée:', {
      id: sessionFromDb.id,
      session_token: sessionFromDb.session_token,
      completed: sessionFromDb.completed,
      migrated_to_account: sessionFromDb.migrated_to_account
    });

    // Étape 3: Vérification que la session n'est pas déjà migrée
    if (sessionFromDb.migrated_to_account) {
      console.log('❌ Session déjà migrée');
      return;
    }

    // Étape 4: Récupération du client avec supabaseAdmin
    console.log('🔍 Étape 2: Récupération du client...');
    
    const { data: client, error: clientError } = await supabaseAdmin
      .from('Client')
      .select('id, email, company_name')
      .eq('email', clientData.email)
      .single();

    if (clientError || !client) {
      console.log('❌ Client non trouvé:', clientData.email);
      return;
    }

    console.log('✅ Client trouvé:', {
      id: client.id,
      email: client.email,
      company_name: client.company_name
    });

    // Étape 5: Récupération des éligibilités avec supabaseAdmin
    console.log('🔍 Étape 3: Récupération des éligibilités...');
    
    const { data: dbEligibilityResults, error: eligibilityError } = await supabaseAdmin
      .from('TemporaryEligibility')
      .select('*')
      .eq('session_id', sessionFromDb.id)
      .order('created_at', { ascending: true });

    if (eligibilityError) {
      console.error('❌ Erreur récupération éligibilités:', eligibilityError);
      return;
    }

    console.log(`✅ ${dbEligibilityResults?.length || 0} éligibilités trouvées`);
    
    if (dbEligibilityResults && dbEligibilityResults.length > 0) {
      dbEligibilityResults.forEach((elig, index) => {
        console.log(`   ${index + 1}. Produit: ${elig.produit_id}, Score: ${elig.eligibility_score}%, Économies: ${elig.estimated_savings}€`);
      });
    }

    // Étape 6: Vérification du mapping des produits
    console.log('🔍 Étape 4: Vérification du mapping des produits...');
    
    const { data: products, error: productsError } = await supabaseAdmin
      .from('ProduitEligible')
      .select('id, nom');

    if (productsError) {
      console.error('❌ Erreur récupération produits:', productsError);
      return;
    }

    console.log(`✅ ${products?.length || 0} produits dans le catalogue`);

    // Étape 7: Création des ClientProduitEligible
    console.log('🔍 Étape 5: Création des produits éligibles...');
    
    const PRODUCT_MAPPING = {
      'TICPE': '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
      'URSSAF': 'd1e8f740-7c2a-4b5e-9a91-0e15c0e7d3a2',
      'DFS': 'e2f9a830-8d3b-4c7c-b590-1d7631c0d4b5',
      'FONCIER': 'c5d2e980-4f63-44c0-b8a9-9d6e8e21c0f7',
      'CIR': '37da1c4e-3fcc-49f8-9acb-9b75e231edfd',
      'CEE': 'b7f3c891-28d9-4982-b0eb-821c9e7cbcf0',
      'AUDIT_ENERGETIQUE': 'bc2b94ec-659b-4cf5-a693-d61178b03caf'
    };

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

        // Vérifier que le produit existe dans le catalogue
        const productExists = products?.some(p => p.id === produitId);
        if (!productExists) {
          console.warn(`⚠️ Produit ${result.produit_id} (${produitId}) non trouvé dans le catalogue`);
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
            original_produit_id: result.produit_id
          },
          notes: `Migration depuis simulateur - Score: ${result.eligibility_score}%, Confiance: ${result.confidence_level}`,
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

    // Étape 8: Insertion des ClientProduitEligible
    console.log('🔍 Étape 6: Insertion des produits éligibles...');
    
    if (clientProduitsEligibles.length > 0) {
      console.log(`📤 Insertion de ${clientProduitsEligibles.length} produits éligibles...`);
      
      const { data: insertedProducts, error: insertError } = await supabaseAdmin
        .from('ClientProduitEligible')
        .insert(clientProduitsEligibles)
        .select();

      if (insertError) {
        console.error('❌ Erreur insertion ClientProduitEligible:', insertError);
        console.error('📋 Détails erreur:', JSON.stringify(insertError, null, 2));
        return;
      }

      console.log(`✅ ${insertedProducts?.length || 0} produits éligibles créés`);
      
      if (insertedProducts && insertedProducts.length > 0) {
        insertedProducts.forEach((prod, index) => {
          console.log(`   ${index + 1}. ID: ${prod.id}, Client: ${prod.clientId}, Produit: ${prod.produitId}, Statut: ${prod.statut}`);
        });
      }
    } else {
      console.log('⚠️ Aucun produit à insérer');
    }

    // Étape 9: Marquage de la session comme migrée
    console.log('🔍 Étape 7: Marquage de la session comme migrée...');
    
    const { error: updateError } = await supabaseAdmin
      .from('TemporarySession')
      .update({
        migrated_to_account: true,
        migrated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionFromDb.id);

    if (updateError) {
      console.error('❌ Erreur marquage session:', updateError);
      return;
    }

    console.log('✅ Session marquée comme migrée');

    // Étape 10: Vérification finale
    console.log('🔍 Étape 8: Vérification finale...');
    
    const { data: finalProducts, error: finalError } = await supabaseAdmin
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', client.id);

    if (finalError) {
      console.error('❌ Erreur vérification finale:', finalError);
    } else {
      console.log(`✅ ${finalProducts?.length || 0} produits éligibles finaux pour le client`);
    }

    // 4. Nettoyage
    console.log('\n4️⃣ Nettoyage...');
    
    // Supprimer les produits éligibles créés
    if (finalProducts && finalProducts.length > 0) {
      const { error: deleteProductsError } = await supabaseAdmin
        .from('ClientProduitEligible')
        .delete()
        .eq('clientId', client.id);

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
      .eq('id', client.id);

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
      .eq('id', sessionFromDb.id);

    if (resetSessionError) {
      console.error('⚠️ Erreur reset session:', resetSessionError);
    } else {
      console.log('✅ Session remise comme non migrée');
    }

    // 5. Résumé final
    console.log('\n📊 RÉSUMÉ FINAL');
    console.log('-'.repeat(30));
    console.log(`   - Session: ${sessionToken}`);
    console.log(`   - Éligibilités: ${dbEligibilityResults?.length || 0}`);
    console.log(`   - Client créé: ${client.id}`);
    console.log(`   - Produits créés: ${finalProducts?.length || 0}`);
    console.log(`   - Logique API avec supabaseAdmin: ${finalProducts && finalProducts.length > 0 ? '✅ Succès' : '❌ Échec'}`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testApiLogicManual();
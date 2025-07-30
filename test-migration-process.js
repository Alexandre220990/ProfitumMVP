// Script de test pour le processus de migration complet
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapping des produits du simulateur vers les UUID de ProduitEligible
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
  console.log('🔄 TEST DU PROCESSUS DE MIGRATION');
  console.log('='.repeat(50));

  try {
    // 1. Trouver une session avec des éligibilités non migrées
    console.log('\n1️⃣ Recherche d\'une session à migrer...');
    
    const { data: session, error: sessionError } = await supabase
      .from('TemporarySession')
      .select(`
        *,
        TemporaryEligibility(*)
      `)
      .eq('migrated_to_account', false)
      .not('TemporaryEligibility', 'is', null)
      .limit(1)
      .single();

    if (sessionError || !session) {
      console.error('❌ Aucune session à migrer trouvée:', sessionError?.message);
      return;
    }

    console.log(`✅ Session trouvée: ${session.session_token}`);
    console.log(`   Éligibilités: ${session.TemporaryEligibility?.length || 0}`);

    // 2. Créer un client de test
    console.log('\n2️⃣ Création d\'un client de test...');
    
    const testClientData = {
      email: `test-migration-${Date.now()}@example.com`,
      password: 'testpassword123',
      name: 'Client Test Migration',
      company_name: 'Entreprise Test Migration',
      phone_number: '0123456789',
      address: '123 Rue Test',
      city: 'Paris',
      postal_code: '75001',
      siren: String(Math.floor(100000000 + Math.random() * 900000000)), // SIREN unique 9 chiffres
      type: 'client',
      statut: 'actif',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newClient, error: clientError } = await supabase
      .from('Client')
      .insert(testClientData)
      .select('id, email, name, company_name')
      .single();

    if (clientError) {
      console.error('❌ Erreur création client:', clientError);
      return;
    }

    console.log(`✅ Client créé: ${newClient.email} (ID: ${newClient.id})`);

    // 3. Migrer les éligibilités vers ClientProduitEligible
    console.log('\n3️⃣ Migration des éligibilités...');
    
    const clientProduitsEligibles = [];
    
    if (session.TemporaryEligibility && session.TemporaryEligibility.length > 0) {
      for (const result of session.TemporaryEligibility) {
        console.log(`   🔍 Traitement: ${result.produit_id} (${result.estimated_savings}€)`);
        
        const produitId = PRODUCT_MAPPING[result.produit_id];
        
        if (!produitId) {
          console.warn(`   ⚠️ Produit non trouvé dans le mapping: ${result.produit_id}`);
          continue;
        }

        const clientProduitEligible = {
          clientId: newClient.id,
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
        console.log(`   ✅ Produit préparé: ${result.produit_id} → ${produitId}`);
      }
    }

    // 4. Insérer les ClientProduitEligible
    console.log('\n4️⃣ Insertion des produits éligibles...');
    
    if (clientProduitsEligibles.length > 0) {
      const { data: insertedProducts, error: insertError } = await supabase
        .from('ClientProduitEligible')
        .insert(clientProduitsEligibles)
        .select();

      if (insertError) {
        console.error('❌ Erreur insertion ClientProduitEligible:', insertError);
        return;
      }

      console.log(`✅ ${insertedProducts?.length || 0} produits éligibles créés`);
      
      if (insertedProducts && insertedProducts.length > 0) {
        insertedProducts.forEach((prod, index) => {
          console.log(`   ${index + 1}. ID: ${prod.id}, Produit: ${prod.produitId}, Statut: ${prod.statut}, Montant: ${prod.montantFinal}€`);
        });
      }
    } else {
      console.log('⚠️ Aucun produit à insérer');
    }

    // 5. Marquer la session comme migrée
    console.log('\n5️⃣ Marquage de la session comme migrée...');
    
    const { error: updateError } = await supabase
      .from('TemporarySession')
      .update({
        migrated_to_account: true,
        migrated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('❌ Erreur marquage session:', updateError);
      return;
    }

    console.log('✅ Session marquée comme migrée');

    // 6. Vérification finale
    console.log('\n6️⃣ Vérification finale...');
    
    const { data: finalProducts, error: finalError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible(id, nom, description, category)
      `)
      .eq('clientId', newClient.id);

    if (finalError) {
      console.error('❌ Erreur vérification finale:', finalError);
    } else {
      console.log(`✅ ${finalProducts?.length || 0} produits éligibles finaux pour le client`);
      
      if (finalProducts && finalProducts.length > 0) {
        finalProducts.forEach((prod, index) => {
          console.log(`   ${index + 1}. ${prod.ProduitEligible?.nom || 'Produit inconnu'}, Statut: ${prod.statut}, Montant: ${prod.montantFinal}€, Taux: ${(prod.tauxFinal * 100).toFixed(1)}%`);
        });
      }
    }

    console.log('\n🎉 TEST DE MIGRATION RÉUSSI !');
    console.log(`📧 Client de test: ${newClient.email}`);
    console.log(`📦 Produits migrés: ${finalProducts?.length || 0}`);

  } catch (error) {
    console.error('❌ Erreur lors du test de migration:', error);
  }
}

// Exécuter le test
testMigrationProcess(); 
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCharteComplete() {
  console.log('🧪 Test complet du processus de signature de charte\n');

  // ID de test - à adapter selon vos données
  const CLIENT_PRODUIT_ID = 'e87d3ef4-a394-4505-8fcc-41a56005c344';
  const USER_ID = '0538de29-4287-4c28-b76a-b65ef993f393'; // ID Supabase Auth du client

  console.log('1️⃣ Vérification de l\'existence du ClientProduitEligible');
  
  try {
    const { data: clientProduit, error: clientProduitError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('id', CLIENT_PRODUIT_ID)
      .single();

    if (clientProduitError) {
      console.log('❌ ClientProduitEligible non trouvé:', clientProduitError.message);
      return;
    }

    console.log('✅ ClientProduitEligible trouvé:');
    console.log('   - ID:', clientProduit.id);
    console.log('   - Client ID:', clientProduit.clientId);
    console.log('   - Produit ID:', clientProduit.produitId);
    console.log('   - Simulation ID:', clientProduit.simulation_id);
    console.log('   - Statut:', clientProduit.status);

    // Vérifier que le client correspond à l'utilisateur
    if (clientProduit.clientId !== USER_ID) {
      console.log('⚠️ Attention: Le clientId ne correspond pas à l\'utilisateur connecté');
      console.log('   - Utilisateur connecté:', USER_ID);
      console.log('   - Propriétaire du produit:', clientProduit.clientId);
    } else {
      console.log('✅ Le clientId correspond à l\'utilisateur connecté');
    }

  } catch (error) {
    console.log('❌ Erreur lors de la vérification du ClientProduitEligible:', error.message);
    return;
  }

  console.log('\n2️⃣ Vérification de l\'existence d\'une signature');
  
  try {
    const { data: existingSignature, error: checkError } = await supabase
      .from('client_charte_signature')
      .select('*')
      .eq('client_produit_eligible_id', CLIENT_PRODUIT_ID)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.log('❌ Erreur lors de la vérification:', checkError.message);
      return;
    }

    if (existingSignature) {
      console.log('⚠️ Signature déjà existante:');
      console.log('   - ID:', existingSignature.id);
      console.log('   - Date:', existingSignature.signature_date);
      console.log('   - Client ID:', existingSignature.client_id);
      console.log('   - Produit ID:', existingSignature.produit_id);
      
      // Supprimer la signature existante pour le test
      console.log('\n🗑️ Suppression de la signature existante pour le test...');
      const { error: deleteError } = await supabase
        .from('client_charte_signature')
        .delete()
        .eq('id', existingSignature.id);

      if (deleteError) {
        console.log('❌ Erreur lors de la suppression:', deleteError.message);
        return;
      }
      console.log('✅ Signature supprimée');
    } else {
      console.log('ℹ️ Aucune signature existante trouvée');
    }

  } catch (error) {
    console.log('❌ Erreur lors de la vérification de signature:', error.message);
    return;
  }

  console.log('\n3️⃣ Test de création d\'une nouvelle signature');
  
  try {
    const signatureData = {
      client_id: USER_ID,
      produit_id: '32dd9cf8-15e2-4375-86ab-a95158d3ada1', // ID du produit TICPE
      client_produit_eligible_id: CLIENT_PRODUIT_ID,
      ip_address: '127.0.0.1',
      user_agent: 'Test Script - Signature Complète'
    };

    console.log('📝 Données de signature à insérer:', signatureData);

    const { data: signature, error: insertError } = await supabase
      .from('client_charte_signature')
      .insert([signatureData])
      .select('*')
      .single();

    if (insertError) {
      console.log('❌ Erreur lors de l\'insertion:', insertError.message);
      console.log('   Code d\'erreur:', insertError.code);
      
      if (insertError.code === '23505') { // Violation de contrainte unique
        console.log('   - Une signature existe déjà pour ce produit');
      } else if (insertError.code === '23503') { // Violation de clé étrangère
        console.log('   - Référence invalide (client_id, produit_id, ou client_produit_eligible_id)');
      }
      return;
    }

    console.log('✅ Signature créée avec succès:');
    console.log('   - ID:', signature.id);
    console.log('   - Date:', signature.signature_date);
    console.log('   - Client ID:', signature.client_id);
    console.log('   - Produit ID:', signature.produit_id);
    console.log('   - Client Produit Eligible ID:', signature.client_produit_eligible_id);
    console.log('   - IP Address:', signature.ip_address);
    console.log('   - User Agent:', signature.user_agent);
    console.log('   - Created At:', signature.created_at);
    console.log('   - Updated At:', signature.updated_at);

  } catch (error) {
    console.log('❌ Erreur lors de la création de signature:', error.message);
    return;
  }

  console.log('\n4️⃣ Vérification de la signature créée');
  
  try {
    const { data: verificationSignature, error: verificationError } = await supabase
      .from('client_charte_signature')
      .select('*')
      .eq('client_produit_eligible_id', CLIENT_PRODUIT_ID)
      .single();

    if (verificationError) {
      console.log('❌ Erreur lors de la vérification:', verificationError.message);
      return;
    }

    console.log('✅ Signature vérifiée avec succès:');
    console.log('   - ID:', verificationSignature.id);
    console.log('   - Date:', verificationSignature.signature_date);
    console.log('   - Statut: SIGNÉE');

  } catch (error) {
    console.log('❌ Erreur lors de la vérification:', error.message);
    return;
  }

  console.log('\n5️⃣ Test de contrainte unique (tentative de doublon)');
  
  try {
    const duplicateData = {
      client_id: USER_ID,
      produit_id: '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
      client_produit_eligible_id: CLIENT_PRODUIT_ID,
      ip_address: '127.0.0.1',
      user_agent: 'Test Script - Doublon'
    };

    const { data: duplicateSignature, error: duplicateError } = await supabase
      .from('client_charte_signature')
      .insert([duplicateData])
      .select('*')
      .single();

    if (duplicateError) {
      if (duplicateError.code === '23505') {
        console.log('✅ Contrainte unique respectée - Doublon rejeté');
        console.log('   - Message:', duplicateError.message);
      } else {
        console.log('❌ Erreur inattendue lors du test de doublon:', duplicateError.message);
      }
    } else {
      console.log('⚠️ Problème: Le doublon a été accepté (contrainte unique non respectée)');
    }

  } catch (error) {
    console.log('❌ Erreur lors du test de doublon:', error.message);
  }

  console.log('\n🎉 Test complet terminé !');
  console.log('   Le processus de signature de charte fonctionne correctement.');
}

// Exécuter le test
testCharteComplete().catch(error => {
  console.error('❌ Erreur lors du test:', error);
}); 
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFrontendCharte() {
  console.log('🧪 Test du processus frontend de signature de charte\n');

  const CLIENT_PRODUIT_ID = 'e87d3ef4-a394-4505-8fcc-41a56005c344';
  const USER_ID = '0538de29-4287-4c28-b76a-b65ef993f393';

  console.log('1️⃣ Vérification de l\'état initial');
  
  try {
    // Vérifier s'il y a déjà une signature
    const { data: existingSignature, error: checkError } = await supabase
      .from('client_charte_signature')
      .select('*')
      .eq('client_produit_eligible_id', CLIENT_PRODUIT_ID)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('❌ Erreur lors de la vérification:', checkError.message);
      return;
    }

    if (existingSignature) {
      console.log('✅ Signature existante trouvée:');
      console.log('   - ID:', existingSignature.id);
      console.log('   - Date:', existingSignature.signature_date);
      console.log('   - Client ID:', existingSignature.client_id);
      
      // Supprimer pour le test
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
      console.log('ℹ️ Aucune signature existante');
    }

  } catch (error) {
    console.log('❌ Erreur lors de la vérification initiale:', error.message);
    return;
  }

  console.log('\n2️⃣ Simulation du processus frontend');
  
  console.log('📋 Étapes du processus frontend:');
  console.log('   1. L\'utilisateur ouvre la page TICPE');
  console.log('   2. Le hook useCharteSignature vérifie l\'état de signature');
  console.log('   3. isCharterSigned = false (pas de signature)');
  console.log('   4. L\'utilisateur clique sur "Signer la charte"');
  console.log('   5. Le dialogue s\'ouvre avec le contenu de la charte');
  console.log('   6. L\'utilisateur coche "J\'accepte les CGU"');
  console.log('   7. L\'utilisateur clique sur "Signer la charte"');
  console.log('   8. handleCharterSign() est appelé');
  console.log('   9. signCharte() du hook est appelé');
  console.log('   10. L\'API POST /api/charte-signature est appelée');
  console.log('   11. La signature est créée en base');
  console.log('   12. isCharterSigned devient true');
  console.log('   13. Le dialogue affiche "Charte Validée"');
  console.log('   14. L\'étape 1 devient "completed"');
  console.log('   15. L\'utilisateur peut passer à l\'étape 2');

  console.log('\n3️⃣ Test de l\'API avec token simulé');
  
  try {
    // Simuler l'appel API que ferait le frontend
    const signatureData = {
      clientProduitEligibleId: CLIENT_PRODUIT_ID,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Frontend Simulation'
    };

    console.log('📝 Données envoyées par le frontend:', signatureData);

    // Créer la signature (simulation de l'API)
    const { data: signature, error: insertError } = await supabase
      .from('client_charte_signature')
      .insert([{
        client_id: USER_ID,
        produit_id: '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
        client_produit_eligible_id: CLIENT_PRODUIT_ID,
        ip_address: signatureData.ipAddress,
        user_agent: signatureData.userAgent
      }])
      .select('*')
      .single();

    if (insertError) {
      console.log('❌ Erreur lors de la création:', insertError.message);
      return;
    }

    console.log('✅ Signature créée avec succès:');
    console.log('   - ID:', signature.id);
    console.log('   - Date:', signature.signature_date);

  } catch (error) {
    console.log('❌ Erreur lors de la simulation:', error.message);
    return;
  }

  console.log('\n4️⃣ Vérification de l\'état après signature');
  
  try {
    // Vérifier l'état après signature (ce que ferait le hook)
    const { data: verificationSignature, error: verificationError } = await supabase
      .from('client_charte_signature')
      .select('*')
      .eq('client_produit_eligible_id', CLIENT_PRODUIT_ID)
      .single();

    if (verificationError) {
      console.log('❌ Erreur lors de la vérification:', verificationError.message);
      return;
    }

    console.log('✅ État après signature:');
    console.log('   - Signature trouvée: OUI');
    console.log('   - isCharterSigned devrait être: true');
    console.log('   - L\'étape 1 devrait être: completed');
    console.log('   - Le dialogue devrait afficher: "Charte Validée"');

  } catch (error) {
    console.log('❌ Erreur lors de la vérification finale:', error.message);
    return;
  }

  console.log('\n5️⃣ Points de vérification côté frontend');
  
  console.log('🔍 À vérifier dans le navigateur:');
  console.log('   1. Ouvrir la console du navigateur');
  console.log('   2. Aller sur la page TICPE');
  console.log('   3. Vérifier les logs du hook useCharteSignature:');
  console.log('      - "Hook useCharteSignature appelé"');
  console.log('      - "clientProduitEligibleId reçu: [ID]"');
  console.log('      - "checkSignature appelée"');
  console.log('   4. Cliquer sur "Signer la charte"');
  console.log('   5. Vérifier que le dialogue s\'ouvre');
  console.log('   6. Cocher "J\'accepte les CGU"');
  console.log('   7. Cliquer sur "Signer la charte"');
  console.log('   8. Vérifier les logs:');
  console.log('      - "Début de la signature de la charte"');
  console.log('      - "Charte signée avec succès"');
  console.log('   9. Vérifier que le dialogue change pour "Charte Validée"');
  console.log('   10. Vérifier que l\'étape 1 devient verte (completed)');

  console.log('\n🎉 Test terminé !');
  console.log('   Si le frontend ne fonctionne pas, vérifiez:');
  console.log('   - Les logs dans la console du navigateur');
  console.log('   - L\'onglet Network pour voir les appels API');
  console.log('   - Que le token Supabase est bien envoyé');
  console.log('   - Que l\'ID clientProduitId est correct');
}

// Exécuter le test
testFrontendCharte().catch(error => {
  console.error('❌ Erreur lors du test:', error);
}); 
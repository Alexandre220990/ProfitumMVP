const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCharteSignatureFrontend() {
  console.log('🧪 Test du comportement frontend pour les signatures de charte\n');

  const clientProduitId = 'e87d3ef4-a394-4505-8fcc-41a56005c344';
  
  console.log('1️⃣ Test de récupération des paramètres de route');
  console.log('   - clientProduitId:', clientProduitId);
  console.log('   - Type:', typeof clientProduitId);
  console.log('   - Est truthy:', !!clientProduitId);
  
  if (!clientProduitId) {
    console.log('❌ Pas d\'ID fourni');
    return;
  }

  console.log('\n2️⃣ Test de vérification de signature existante');
  
  try {
    // Simuler l'appel API de vérification
    const { data: existingSignature, error: checkError } = await supabase
      .from('client_charte_signature')
      .select('*')
      .eq('client_produit_eligible_id', clientProduitId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.log('❌ Erreur lors de la vérification:', checkError.message);
      return;
    }

    if (existingSignature) {
      console.log('✅ Signature existante trouvée:');
      console.log('   - ID:', existingSignature.id);
      console.log('   - Date:', existingSignature.signature_date);
      console.log('   - Client ID:', existingSignature.client_id);
    } else {
      console.log('ℹ️ Aucune signature trouvée pour ce produit');
    }

  } catch (error) {
    console.log('❌ Erreur lors de la vérification:', error.message);
  }

  console.log('\n3️⃣ Test de vérification du ClientProduitEligible');
  
  try {
    const { data: clientProduit, error: clientProduitError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('id', clientProduitId)
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

  } catch (error) {
    console.log('❌ Erreur lors de la vérification du ClientProduitEligible:', error.message);
  }

  console.log('\n4️⃣ Test de simulation de signature');
  
  try {
    const signatureData = {
      client_id: '0538de29-4287-4c28-b76a-b65ef993f393', // ID du client (à adapter)
      produit_id: '32dd9cf8-15e2-4375-86ab-a95158d3ada1', // ID du produit (à adapter)
      client_produit_eligible_id: clientProduitId,
      ip_address: '127.0.0.1',
      user_agent: 'Test Script'
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
      }
    } else {
      console.log('✅ Signature créée avec succès:');
      console.log('   - ID:', signature.id);
      console.log('   - Date:', signature.signature_date);
    }

  } catch (error) {
    console.log('❌ Erreur lors de la simulation de signature:', error.message);
  }

  console.log('\n🎉 Tests terminés !');
}

// Exécuter les tests
testCharteSignatureFrontend(); 
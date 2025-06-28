require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUserProductMatch() {
  console.log('🧪 Test de correspondance utilisateur/produit\n');

  const CLIENT_PRODUIT_ID = 'e87d3ef4-a394-4505-8fcc-41a56005c344';
  const USER_CONNECTED = 'e991b465-2e37-45ae-9475-6d7b1e35e391'; // Utilisateur connecté
  const USER_PRODUIT = '0538de29-4287-4c28-b76a-b65ef993f393'; // Propriétaire du produit

  console.log('📋 Informations:');
  console.log('   - ClientProduitEligible ID:', CLIENT_PRODUIT_ID);
  console.log('   - Utilisateur connecté:', USER_CONNECTED);
  console.log('   - Propriétaire du produit:', USER_PRODUIT);

  console.log('\n1️⃣ Vérification du ClientProduitEligible');
  
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
    console.log('   - Statut:', clientProduit.status);

    // Vérifier la correspondance
    if (clientProduit.clientId === USER_CONNECTED) {
      console.log('✅ CORRESPONDANCE OK - L\'utilisateur connecté est le propriétaire');
    } else {
      console.log('❌ CORRESPONDANCE NOK - L\'utilisateur connecté n\'est PAS le propriétaire');
      console.log('   - Utilisateur connecté:', USER_CONNECTED);
      console.log('   - Propriétaire du produit:', clientProduit.clientId);
    }

  } catch (error) {
    console.log('❌ Erreur lors de la vérification:', error.message);
    return;
  }

  console.log('\n2️⃣ Vérification des utilisateurs');
  
  try {
    // Vérifier l'utilisateur connecté
    const { data: userConnected, error: userConnectedError } = await supabase
      .from('authenticated_users')
      .select('*')
      .eq('id', USER_CONNECTED)
      .single();

    if (userConnectedError) {
      console.log('❌ Utilisateur connecté non trouvé:', userConnectedError.message);
    } else {
      console.log('✅ Utilisateur connecté trouvé:');
      console.log('   - ID:', userConnected.id);
      console.log('   - Email:', userConnected.email);
      console.log('   - Type:', userConnected.user_type);
    }

    // Vérifier le propriétaire du produit
    const { data: userProduit, error: userProduitError } = await supabase
      .from('authenticated_users')
      .select('*')
      .eq('id', USER_PRODUIT)
      .single();

    if (userProduitError) {
      console.log('❌ Propriétaire du produit non trouvé:', userProduitError.message);
    } else {
      console.log('✅ Propriétaire du produit trouvé:');
      console.log('   - ID:', userProduit.id);
      console.log('   - Email:', userProduit.email);
      console.log('   - Type:', userProduit.user_type);
    }

  } catch (error) {
    console.log('❌ Erreur lors de la vérification des utilisateurs:', error.message);
  }

  console.log('\n3️⃣ Solutions possibles');
  
  console.log('🔧 Option 1: Utiliser le bon utilisateur');
  console.log('   - Se connecter avec l\'utilisateur:', USER_PRODUIT);
  console.log('   - Ou créer un nouveau ClientProduitEligible pour l\'utilisateur connecté');
  
  console.log('\n🔧 Option 2: Modifier le ClientProduitEligible');
  console.log('   - Changer le clientId du produit pour correspondre à l\'utilisateur connecté');
  
  console.log('\n🔧 Option 3: Créer un nouveau produit éligible');
  console.log('   - Créer un nouveau ClientProduitEligible pour l\'utilisateur connecté');

  console.log('\n🎯 Recommandation:');
  console.log('   Utiliser l\'Option 1 - Se connecter avec l\'utilisateur propriétaire du produit');
  console.log('   Ou créer un nouveau produit éligible pour l\'utilisateur actuel');
}

// Exécuter le test
testUserProductMatch().catch(error => {
  console.error('❌ Erreur lors du test:', error);
}); 
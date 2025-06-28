require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUserProduct() {
  console.log('🔧 Correction de la correspondance utilisateur/produit\n');

  const USER_CONNECTED = 'e991b465-2e37-45ae-9475-6d7b1e35e391'; // Utilisateur connecté
  const PRODUIT_ID = '32dd9cf8-15e2-4375-86ab-a95158d3ada1'; // ID du produit TICPE

  console.log('📋 Informations:');
  console.log('   - Utilisateur connecté:', USER_CONNECTED);
  console.log('   - Produit ID:', PRODUIT_ID);

  console.log('\n1️⃣ Vérification de l\'utilisateur connecté');
  
  try {
    // Vérifier que l'utilisateur existe dans la table Client
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('*')
      .eq('auth_id', USER_CONNECTED)
      .single();

    if (clientError) {
      console.log('❌ Utilisateur non trouvé dans la table Client:', clientError.message);
      console.log('   Vérifiez que l\'utilisateur est bien créé dans la table Client');
      return;
    }

    console.log('✅ Utilisateur trouvé dans la table Client:');
    console.log('   - ID:', client.id);
    console.log('   - Auth ID:', client.auth_id);
    console.log('   - Email:', client.email);

  } catch (error) {
    console.log('❌ Erreur lors de la vérification:', error.message);
    return;
  }

  console.log('\n2️⃣ Vérification des produits éligibles existants');
  
  try {
    const { data: existingProducts, error: existingError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', USER_CONNECTED)
      .eq('produitId', PRODUIT_ID);

    if (existingError) {
      console.log('❌ Erreur lors de la vérification:', existingError.message);
      return;
    }

    if (existingProducts && existingProducts.length > 0) {
      console.log('⚠️ Produit éligible existant trouvé:');
      existingProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ID: ${product.id}, Statut: ${product.status}`);
      });
      
      console.log('\n🔧 Utilisation du produit existant');
      const productToUse = existingProducts[0];
      console.log('   - ID à utiliser:', productToUse.id);
      console.log('   - URL de test: http://localhost:3000/produits/ticpe/' + productToUse.id);
      return;
    } else {
      console.log('ℹ️ Aucun produit éligible trouvé pour cet utilisateur');
    }

  } catch (error) {
    console.log('❌ Erreur lors de la vérification:', error.message);
    return;
  }

  console.log('\n3️⃣ Création d\'un nouveau ClientProduitEligible');
  
  try {
    const newProductData = {
      clientId: USER_CONNECTED,
      produitId: PRODUIT_ID,
      statut: 'eligible', // Champ requis avec contrainte
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Données du nouveau produit:', newProductData);

    const { data: newProduct, error: createError } = await supabase
      .from('ClientProduitEligible')
      .insert([newProductData])
      .select('*')
      .single();

    if (createError) {
      console.log('❌ Erreur lors de la création:', createError.message);
      return;
    }

    console.log('✅ Nouveau ClientProduitEligible créé:');
    console.log('   - ID:', newProduct.id);
    console.log('   - Client ID:', newProduct.clientId);
    console.log('   - Produit ID:', newProduct.produitId);
    console.log('   - Statut:', newProduct.status);

    console.log('\n🎯 URL de test:');
    console.log(`   http://localhost:3000/produits/ticpe/${newProduct.id}`);

  } catch (error) {
    console.log('❌ Erreur lors de la création:', error.message);
    return;
  }

  console.log('\n4️⃣ Test de la nouvelle correspondance');
  
  try {
    // Vérifier que la correspondance fonctionne maintenant
    const { data: testProduct, error: testError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', USER_CONNECTED)
      .eq('produitId', PRODUIT_ID)
      .single();

    if (testError) {
      console.log('❌ Erreur lors du test:', testError.message);
      return;
    }

    console.log('✅ Test réussi:');
    console.log('   - Produit trouvé:', testProduct.id);
    console.log('   - Correspondance utilisateur/produit: OK');

  } catch (error) {
    console.log('❌ Erreur lors du test:', error.message);
  }

  console.log('\n🎉 Correction terminée !');
  console.log('   Utilisez la nouvelle URL pour tester la signature de charte.');
}

// Exécuter la correction
fixUserProduct().catch(error => {
  console.error('❌ Erreur lors de la correction:', error);
}); 
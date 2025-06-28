const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructure() {
  console.log('🔍 Vérification de la structure de la table ClientProduitEligible...\n');

  try {
    // Récupérer un enregistrement pour voir les colonnes disponibles
    const { data: clientProduits, error } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }

    if (clientProduits && clientProduits.length > 0) {
      const produit = clientProduits[0];
      console.log('📋 Colonnes disponibles dans ClientProduitEligible:');
      Object.keys(produit).forEach(key => {
        console.log(`  - ${key}: ${typeof produit[key]} = ${produit[key]}`);
      });

      // Vérifier spécifiquement les colonnes d'avancement
      console.log('\n🔍 Vérification des colonnes d\'avancement:');
      console.log('  - current_step existe:', 'current_step' in produit);
      console.log('  - progress existe:', 'progress' in produit);
      
      if ('current_step' in produit) {
        console.log('  - current_step valeur:', produit.current_step);
      }
      if ('progress' in produit) {
        console.log('  - progress valeur:', produit.progress);
      }
    } else {
      console.log('ℹ️ Aucun enregistrement trouvé dans ClientProduitEligible');
    }

    // Vérifier la table ProduitEligible
    console.log('\n🔍 Vérification de la table ProduitEligible...');
    const { data: produits, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('*')
      .limit(1);

    if (produitsError) {
      console.error('❌ Erreur ProduitEligible:', produitsError);
    } else if (produits && produits.length > 0) {
      console.log('✅ Table ProduitEligible accessible');
      console.log('📋 Colonnes disponibles dans ProduitEligible:');
      Object.keys(produits[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof produits[0][key]} = ${produits[0][key]}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkTableStructure(); 
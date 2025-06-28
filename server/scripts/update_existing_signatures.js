const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateExistingSignatures() {
  console.log('🔄 Mise à jour des produits éligibles avec signature existante...\n');

  try {
    // 1. Récupérer tous les produits éligibles avec signature
    console.log('1️⃣ Recherche des produits éligibles avec signature...');
    
    // D'abord, récupérer toutes les signatures
    const { data: signatures, error: signaturesError } = await supabase
      .from('client_charte_signature')
      .select('*');

    if (signaturesError) {
      console.error('❌ Erreur récupération signatures:', signaturesError);
      return;
    }

    console.log(`✅ ${signatures?.length || 0} signatures trouvées`);

    if (!signatures || signatures.length === 0) {
      console.log('ℹ️ Aucune signature trouvée');
      return;
    }

    // 2. Pour chaque signature, mettre à jour le produit éligible correspondant
    console.log('\n2️⃣ Mise à jour des produits éligibles...');
    
    for (const signature of signatures) {
      console.log(`\n📝 Traitement de la signature ${signature.id}...`);
      
      // Trouver le produit éligible correspondant
      const { data: clientProduits, error: findError } = await supabase
        .from('ClientProduitEligible')
        .select('*')
        .eq('clientId', signature.client_id)
        .eq('produitId', signature.produit_id);

      if (findError) {
        console.error('❌ Erreur recherche produit éligible:', findError);
        continue;
      }

      if (!clientProduits || clientProduits.length === 0) {
        console.log('⚠️ Aucun produit éligible trouvé pour cette signature');
        continue;
      }

      const clientProduit = clientProduits[0];
      console.log(`✅ Produit éligible trouvé: ${clientProduit.id}`);
      console.log(`   - État avant: current_step=${clientProduit.current_step}, progress=${clientProduit.progress}`);

      // Mettre à jour l'avancement
      const { error: updateError } = await supabase
        .from('ClientProduitEligible')
        .update({
          current_step: 1,
          progress: 25,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientProduit.id);

      if (updateError) {
        console.error('❌ Erreur mise à jour:', updateError);
        continue;
      }

      console.log('✅ Mise à jour réussie: current_step=1, progress=25');
    }

    // 3. Vérification finale
    console.log('\n3️⃣ Vérification finale...');
    const { data: finalCheck, error: checkError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .gt('current_step', 0);

    if (checkError) {
      console.error('❌ Erreur vérification finale:', checkError);
      return;
    }

    console.log(`✅ ${finalCheck?.length || 0} produits éligibles avec avancement > 0`);
    
    if (finalCheck && finalCheck.length > 0) {
      finalCheck.forEach(produit => {
        console.log(`   - ${produit.id}: étape ${produit.current_step}, ${produit.progress}%`);
      });
    }

    console.log('\n🎉 Mise à jour terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  }
}

updateExistingSignatures(); 
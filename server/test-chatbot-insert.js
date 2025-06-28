const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testChatbotInsert() {
  console.log('🧪 Test d\'insertion réelle des produits éligibles\n');

  try {
    // Générer un clientId de test unique (UUID valide)
    const testClientId = uuidv4();
    const testSimulationId = Date.now();

    console.log(`📋 Test avec clientId: ${testClientId}`);
    console.log(`📋 SimulationId: ${testSimulationId}\n`);

    // Données du chatbot simulées
    const mockChatbotProducts = [
      {
        nom: 'TICPE',
        description: 'Remboursement de la Taxe Intérieure de Consommation sur les Produits Énergétiques',
        estimatedGain: 5000,
        gainPotentiel: 5000
      },
      {
        nom: 'URSSAF',
        description: 'Optimisation de Charges Sociales',
        estimatedGain: 3000,
        gainPotentiel: 3000
      }
    ];

    const savedProducts = [];

    for (const product of mockChatbotProducts) {
      try {
        console.log(`🔄 Traitement du produit: ${product.nom}`);

        // 1. Trouver le produit dans ProduitEligible
        const { data: produitEligible, error: produitError } = await supabase
          .from('ProduitEligible')
          .select('*')
          .eq('nom', product.nom)
          .single();

        if (produitError || !produitEligible) {
          console.log(`   ❌ Produit "${product.nom}" non trouvé dans la base`);
          console.log(`   Erreur:`, produitError);
          continue;
        }

        console.log(`   ✅ Produit trouvé: ${produitEligible.nom} (ID: ${produitEligible.id})`);

        // 2. Insérer dans ClientProduitEligible
        const insertData = {
          clientId: testClientId,
          produitId: produitEligible.id,
          simulationId: testSimulationId,
          statut: 'eligible',
          tauxFinal: 0.85,
          montantFinal: product.estimatedGain,
          dureeFinale: 12
        };

        console.log(`   📝 Données d'insertion:`, insertData);

        const { data: savedProduct, error: saveError } = await supabase
          .from('ClientProduitEligible')
          .insert(insertData)
          .select()
          .single();

        if (saveError) {
          console.log(`   ❌ Erreur d'insertion: ${saveError.message}`);
          console.log(`   Détails:`, saveError);
        } else {
          console.log(`   ✅ Insertion réussie !`);
          console.log(`   ID généré: ${savedProduct.id}`);
          savedProducts.push(savedProduct);
        }

      } catch (error) {
        console.log(`   ❌ Erreur générale pour ${product.nom}:`, error.message);
      }

      console.log(''); // Ligne vide pour la lisibilité
    }

    // Vérification finale
    console.log('🔍 Vérification finale...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', testClientId);

    if (finalError) {
      console.error('❌ Erreur lors de la vérification finale:', finalError);
    } else {
      console.log(`✅ ${finalCheck.length} entrées trouvées pour le client de test`);
      
      if (finalCheck.length > 0) {
        console.log('\n📊 Détails des entrées créées:');
        finalCheck.forEach((entry, index) => {
          console.log(`   ${index + 1}. ID: ${entry.id}`);
          console.log(`      ProduitId: ${entry.produitId}`);
          console.log(`      Statut: ${entry.statut}`);
          console.log(`      Montant: ${entry.montantFinal}€`);
          console.log(`      Taux: ${entry.tauxFinal}`);
          console.log(`      Durée: ${entry.dureeFinale} mois`);
          console.log('');
        });
      }
    }

    // Nettoyage (optionnel - décommenter pour supprimer les données de test)
    /*
    console.log('🧹 Nettoyage des données de test...');
    const { error: deleteError } = await supabase
      .from('ClientProduitEligible')
      .delete()
      .eq('clientId', testClientId);

    if (deleteError) {
      console.log('⚠️ Erreur lors du nettoyage:', deleteError);
    } else {
      console.log('✅ Données de test supprimées');
    }
    */

    console.log('\n✅ Test d\'insertion terminé !');
    console.log(`📈 Résultat: ${savedProducts.length}/${mockChatbotProducts.length} produits insérés avec succès`);

  } catch (error) {
    console.error('❌ Erreur générale du test:', error);
  }
}

// Exécuter le test
testChatbotInsert(); 
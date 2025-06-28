const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testChatbotSave() {
  console.log('🧪 Test du processus de sauvegarde des produits éligibles\n');

  try {
    // 1. Vérifier la structure de la table ProduitEligible
    console.log('1️⃣ Vérification de la table ProduitEligible...');
    const { data: produits, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('*')
      .limit(5);

    if (produitsError) {
      console.error('❌ Erreur lors de la récupération des produits:', produitsError);
      return;
    }

    console.log(`✅ ${produits.length} produits trouvés dans la base:`);
    produits.forEach(p => {
      console.log(`   - ${p.nom} (ID: ${p.id})`);
    });

    // 2. Vérifier la structure de la table ClientProduitEligible
    console.log('\n2️⃣ Vérification de la table ClientProduitEligible...');
    const { data: clientProduits, error: clientProduitsError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .limit(3);

    if (clientProduitsError) {
      console.error('❌ Erreur lors de la récupération des client-produits:', clientProduitsError);
      return;
    }

    console.log(`✅ ${clientProduits.length} entrées trouvées dans ClientProduitEligible`);
    if (clientProduits.length > 0) {
      console.log('   Structure d\'une entrée:', Object.keys(clientProduits[0]));
    }

    // 3. Test de matching par nom
    console.log('\n3️⃣ Test de matching par nom...');
    const testProductName = 'TICPE';
    const { data: matchedProduct, error: matchError } = await supabase
      .from('ProduitEligible')
      .select('*')
      .eq('nom', testProductName)
      .single();

    if (matchError) {
      console.error(`❌ Erreur lors du matching de "${testProductName}":`, matchError);
    } else {
      console.log(`✅ Produit "${testProductName}" trouvé avec l'ID: ${matchedProduct.id}`);
    }

    // 4. Test d'insertion (simulation)
    console.log('\n4️⃣ Test d\'insertion simulée...');
    const testClientId = '550e8400-e29b-41d4-a716-446655440000'; // UUID de test
    const testSimulationId = Date.now();

    // Simuler les données du chatbot
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

    console.log('   Données du chatbot simulées:', mockChatbotProducts);

    // Simuler le processus de sauvegarde
    for (const product of mockChatbotProducts) {
      try {
        // Trouver le produit dans ProduitEligible
        const { data: produitEligible, error: produitError } = await supabase
          .from('ProduitEligible')
          .select('*')
          .eq('nom', product.nom)
          .single();

        if (produitError || !produitEligible) {
          console.log(`   ⚠️ Produit "${product.nom}" non trouvé dans la base`);
          continue;
        }

        console.log(`   ✅ Produit "${product.nom}" trouvé avec l'ID: ${produitEligible.id}`);

        // Vérifier si l'entrée existe déjà
        const { data: existingEntry, error: checkError } = await supabase
          .from('ClientProduitEligible')
          .select('*')
          .eq('clientId', testClientId)
          .eq('produitId', produitEligible.id)
          .eq('simulationId', testSimulationId)
          .single();

        if (existingEntry) {
          console.log(`   ⚠️ Entrée déjà existante pour ${product.nom}`);
          continue;
        }

        // Simuler l'insertion (commenté pour éviter les insertions de test)
        console.log(`   📝 Simulation d'insertion pour ${product.nom}:`);
        console.log(`      - clientId: ${testClientId}`);
        console.log(`      - produitId: ${produitEligible.id}`);
        console.log(`      - simulationId: ${testSimulationId}`);
        console.log(`      - montantFinal: ${product.estimatedGain}`);

        // Décommenter pour tester l'insertion réelle
        /*
        const { data: savedProduct, error: saveError } = await supabase
          .from('ClientProduitEligible')
          .insert({
            clientId: testClientId,
            produitId: produitEligible.id,
            simulationId: testSimulationId,
            statut: 'eligible',
            tauxFinal: 0.85,
            montantFinal: product.estimatedGain,
            dureeFinale: 12,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (saveError) {
          console.log(`   ❌ Erreur d'insertion: ${saveError.message}`);
        } else {
          console.log(`   ✅ Insertion réussie pour ${product.nom}`);
        }
        */

      } catch (error) {
        console.log(`   ❌ Erreur pour ${product.nom}:`, error.message);
      }
    }

    // 5. Vérification finale
    console.log('\n5️⃣ Vérification finale...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible (
          nom,
          description
        )
      `)
      .eq('clientId', testClientId)
      .limit(5);

    if (finalError) {
      console.error('❌ Erreur lors de la vérification finale:', finalError);
    } else {
      console.log(`✅ ${finalCheck.length} entrées trouvées pour le client de test`);
    }

    console.log('\n✅ Test terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur générale du test:', error);
  }
}

// Exécuter le test
testChatbotSave(); 
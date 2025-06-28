const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testChatbotWithCorrectColumnNames() {
  console.log('🧪 Test du chatbot avec les bons noms de colonnes\n');

  const testClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Vérifier la structure exacte de ClientProduitEligible
    console.log('1️⃣ Vérification de la structure de ClientProduitEligible...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'ClientProduitEligible')
      .order('ordinal_position');

    if (columnsError) {
      console.log(`❌ Erreur lors de la vérification des colonnes: ${columnsError.message}`);
      return;
    }

    console.log('   Colonnes trouvées:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    // 2. Créer une simulation
    console.log('\n2️⃣ Création d\'une simulation...');
    const { data: simulation, error: simError } = await supabase
      .from('Simulation')
      .insert({
        clientId: testClientId,
        statut: 'termine',
        type: 'chatbot',
        dateCreation: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        Answers: {
          test: true,
          source: 'chatbot'
        },
        score: 85,
        tempsCompletion: 120
      })
      .select()
      .single();

    if (simError) {
      console.log(`❌ Erreur création simulation: ${simError.message}`);
      return;
    }

    console.log(`✅ Simulation créée avec l'ID: ${simulation.id}`);

    // 3. Simuler les données du chatbot
    const mockChatbotProducts = [
      {
        nom: 'TICPE',
        estimatedGain: 5000
      },
      {
        nom: 'URSSAF',
        estimatedGain: 3000
      }
    ];

    // 4. Insérer les produits éligibles avec les bons noms de colonnes
    console.log('\n3️⃣ Insertion des produits éligibles...');
    const savedProducts = [];

    for (const product of mockChatbotProducts) {
      try {
        // Trouver le produit
        const { data: produitEligible, error: produitError } = await supabase
          .from('ProduitEligible')
          .select('*')
          .eq('nom', product.nom)
          .single();

        if (produitError || !produitEligible) {
          console.log(`   ⚠️ Produit "${product.nom}" non trouvé`);
          continue;
        }

        // Insérer ClientProduitEligible avec les BONS noms de colonnes
        const insertData = {
          clientId: testClientId,
          produitId: produitEligible.id,
          simulationId: simulation.id,
          statut: 'eligible',
          tauxFinal: 0.85,           // camelCase correct
          montantFinal: product.estimatedGain,  // camelCase correct
          dureeFinale: 12,           // camelCase correct
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log(`   📝 Données d'insertion pour ${product.nom}:`, insertData);

        const { data: savedProduct, error: saveError } = await supabase
          .from('ClientProduitEligible')
          .insert(insertData)
          .select()
          .single();

        if (saveError) {
          console.log(`   ❌ Erreur pour ${product.nom}: ${saveError.message}`);
          console.log(`   Détails:`, saveError);
        } else {
          console.log(`   ✅ ${product.nom} sauvegardé (ID: ${savedProduct.id})`);
          savedProducts.push(savedProduct);
        }

      } catch (error) {
        console.log(`   ❌ Erreur générale pour ${product.nom}: ${error.message}`);
      }
    }

    // 5. Vérification finale
    console.log('\n4️⃣ Vérification finale...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', testClientId)
      .eq('simulationId', simulation.id);

    if (finalError) {
      console.log(`❌ Erreur vérification: ${finalError.message}`);
    } else {
      console.log(`✅ ${finalCheck.length} produits trouvés pour cette simulation`);
      
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

    console.log('\n✅ Test avec les bons noms de colonnes terminé !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testChatbotWithCorrectColumnNames(); 
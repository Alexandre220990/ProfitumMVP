const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testSimpleInsert() {
  console.log('🧪 Test d\'insertion simple avec les bons noms de colonnes\n');

  const testClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Créer une simulation
    console.log('1️⃣ Création d\'une simulation...');
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

    // 2. Trouver un produit TICPE
    console.log('\n2️⃣ Recherche du produit TICPE...');
    const { data: produit, error: produitError } = await supabase
      .from('ProduitEligible')
      .select('*')
      .eq('nom', 'TICPE')
      .single();

    if (produitError || !produit) {
      console.log(`❌ Produit TICPE non trouvé: ${produitError?.message}`);
      return;
    }

    console.log(`✅ Produit TICPE trouvé (ID: ${produit.id})`);

    // 3. Insérer avec les BONS noms de colonnes
    console.log('\n3️⃣ Insertion avec les bons noms de colonnes...');
    const insertData = {
      clientId: testClientId,
      produitId: produit.id,
      simulationId: simulation.id,
      statut: 'eligible',
      tauxFinal: 0.85,           // camelCase correct
      montantFinal: 5000,        // camelCase correct
      dureeFinale: 12,           // camelCase correct
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Données d\'insertion:', JSON.stringify(insertData, null, 2));

    const { data: savedProduct, error: saveError } = await supabase
      .from('ClientProduitEligible')
      .insert(insertData)
      .select()
      .single();

    if (saveError) {
      console.log(`❌ Erreur d'insertion: ${saveError.message}`);
      console.log('Détails:', saveError);
    } else {
      console.log(`✅ Produit sauvegardé avec succès!`);
      console.log('📊 Détails:', JSON.stringify(savedProduct, null, 2));
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testSimpleInsert(); 
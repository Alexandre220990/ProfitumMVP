const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseService = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkProductsDirect() {
  console.log('🔍 Vérification directe des produits éligibles\n');

  const testClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Vérifier les produits éligibles directement
    console.log('1️⃣ Produits éligibles du client...');
    
    const { data: produits, error: prodError } = await supabaseService
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', testClientId)
      .order('created_at', { ascending: false });

    if (prodError) {
      console.log(`❌ Erreur produits: ${prodError.message}`);
    } else {
      console.log(`✅ ${produits.length} produits éligibles trouvés:`);
      produits.forEach((prod, index) => {
        console.log(`   ${index + 1}. ID: ${prod.id}`);
        console.log(`      ProduitId: ${prod.produitId}`);
        console.log(`      SimulationId: ${prod.simulationId}`);
        console.log(`      Statut: ${prod.statut}`);
        console.log(`      Montant: ${prod.montantFinal}€`);
        console.log(`      Taux: ${prod.tauxFinal}`);
        console.log(`      Durée: ${prod.dureeFinale} mois`);
        console.log(`      Créé le: ${prod.created_at}`);
        console.log('');
      });
    }

    // 2. Récupérer les détails des produits
    if (produits && produits.length > 0) {
      console.log('2️⃣ Détails des produits...');
      
      for (const prod of produits) {
        const { data: produitDetails, error: detailError } = await supabaseService
          .from('ProduitEligible')
          .select('*')
          .eq('id', prod.produitId)
          .single();

        if (detailError) {
          console.log(`   ❌ Erreur détails pour ${prod.produitId}: ${detailError.message}`);
        } else {
          console.log(`   ✅ ${produitDetails.nom}: ${produitDetails.description}`);
          console.log(`      Gain: ${prod.montantFinal}€ | Taux: ${prod.tauxFinal} | Durée: ${prod.dureeFinale} mois`);
        }
      }
    }

    // 3. Vérifier les routes API qui posent problème
    console.log('\n3️⃣ Vérification des routes API...');
    
    // Route produits-eligibles
    console.log('   🔍 Route /api/produits-eligibles/client/:clientId');
    const { data: apiProduits, error: apiProdError } = await supabaseService
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', testClientId);

    if (apiProdError) {
      console.log(`   ❌ Erreur API produits: ${apiProdError.message}`);
    } else {
      console.log(`   ✅ ${apiProduits.length} produits trouvés via API`);
    }

    // Route simulations
    console.log('   🔍 Route /api/simulations/check-recent/:clientId');
    const { data: apiSims, error: apiSimError } = await supabaseService
      .from('Simulation')
      .select('*')
      .eq('clientId', testClientId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (apiSimError) {
      console.log(`   ❌ Erreur API simulations: ${apiSimError.message}`);
    } else {
      console.log(`   ✅ ${apiSims.length} simulations récentes trouvées via API`);
    }

    // 4. Résumé pour le dashboard
    console.log('\n4️⃣ Résumé pour le dashboard:');
    console.log(`   - Client: ${testClientId}`);
    console.log(`   - Produits éligibles: ${produits?.length || 0}`);
    
    if (produits && produits.length > 0) {
      const totalGain = produits.reduce((sum, p) => sum + (p.montantFinal || 0), 0);
      console.log(`   - Gain total potentiel: ${totalGain.toLocaleString()}€`);
      
      // Grouper par simulation
      const bySimulation = produits.reduce((acc, p) => {
        if (!acc[p.simulationId]) acc[p.simulationId] = [];
        acc[p.simulationId].push(p);
        return acc;
      }, {});
      
      console.log('   - Répartition par simulation:');
      Object.entries(bySimulation).forEach(([simId, prods]) => {
        const simGain = prods.reduce((sum, p) => sum + (p.montantFinal || 0), 0);
        console.log(`     * Simulation ${simId}: ${prods.length} produits, ${simGain.toLocaleString()}€`);
      });
    }

    console.log('\n✅ Vérification directe terminée !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la vérification
checkProductsDirect(); 
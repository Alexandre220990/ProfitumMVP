const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseService = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function testDashboardAPI() {
  console.log('🧪 Test des routes API du dashboard\n');

  const testClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Test direct des données dans Supabase
    console.log('1️⃣ Test direct des données dans Supabase...');
    
    // Vérifier les produits éligibles
    const { data: produits, error: prodError } = await supabaseService
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', testClientId)
      .order('created_at', { ascending: false });

    if (prodError) {
      console.log(`❌ Erreur produits: ${prodError.message}`);
    } else {
      console.log(`✅ ${produits.length} produits éligibles trouvés directement:`);
      produits.forEach((prod, index) => {
        console.log(`   ${index + 1}. ID: ${prod.id}`);
        console.log(`      ProduitId: ${prod.produitId}`);
        console.log(`      Montant: ${prod.montantFinal}€`);
        console.log(`      Statut: ${prod.statut}`);
        console.log(`      Créé le: ${prod.created_at}`);
        console.log('');
      });
    }

    // Vérifier les simulations
    const { data: simulations, error: simError } = await supabaseService
      .from('Simulation')
      .select('*')
      .eq('clientId', testClientId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (simError) {
      console.log(`❌ Erreur simulations: ${simError.message}`);
    } else {
      console.log(`✅ ${simulations.length} simulations trouvées directement:`);
      simulations.forEach((sim, index) => {
        console.log(`   ${index + 1}. ID: ${sim.id}`);
        console.log(`      Type: ${sim.type}`);
        console.log(`      Statut: ${sim.statut}`);
        console.log(`      Score: ${sim.score}`);
        console.log(`      Créé le: ${sim.created_at}`);
        console.log('');
      });
    }

    // 2. Test des routes API (simulation)
    console.log('2️⃣ Test des routes API (simulation)...');
    
    // Simuler l'appel à /api/produits-eligibles/client/:clientId
    console.log('   🔍 Route /api/produits-eligibles/client/:clientId');
    const query_text = `
      SELECT 
        cpe.id,
        cpe."clientId" as client_id,
        cpe."produitId" as produit_id,
        cpe."simulationId" as simulation_id,
        cpe."tauxFinal" as taux_final,
        cpe."montantFinal" as montant_final,
        cpe."dureeFinale" as duree_finale,
        cpe."created_at" as created_at,
        cpe."updated_at" as updated_at,
        json_build_object(
          'nom', pe.nom,
          'description', pe.description,
          'tauxMin', pe."tauxMin",
          'tauxMax', pe."tauxMax",
          'montantMin', pe."montantMin",
          'montantMax', pe."montantMax",
          'dureeMin', pe."dureeMin",
          'dureeMax', pe."dureeMax"
        ) AS produit
      FROM "ClientProduitEligible" cpe
      JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
      WHERE cpe."clientId" = $1
      ORDER BY cpe."created_at" DESC
    `;
    
    const { data: apiProduits, error: apiProdError } = await supabaseService
      .rpc('exec_sql', { sql_query: query_text, params: [testClientId] });

    if (apiProdError) {
      console.log(`   ❌ Erreur API produits: ${apiProdError.message}`);
    } else {
      console.log(`   ✅ ${apiProduits?.length || 0} produits trouvés via API simulée`);
    }

    // Simuler l'appel à /api/simulations/check-recent/:clientId
    console.log('   🔍 Route /api/simulations/check-recent/:clientId');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: recentSims, error: recentSimError } = await supabaseService
      .from('Simulation')
      .select('*')
      .eq('clientId', testClientId)
      .gt('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentSimError) {
      console.log(`   ❌ Erreur API simulations: ${recentSimError.message}`);
    } else {
      console.log(`   ✅ ${recentSims?.length || 0} simulations récentes trouvées via API simulée`);
    }

    // 3. Résumé pour le dashboard
    console.log('\n3️⃣ Résumé pour le dashboard:');
    console.log(`   - Client: ${testClientId}`);
    console.log(`   - Produits éligibles: ${produits?.length || 0}`);
    console.log(`   - Simulations totales: ${simulations?.length || 0}`);
    console.log(`   - Simulations récentes: ${recentSims?.length || 0}`);
    
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

    console.log('\n✅ Test des routes API terminé !');
    console.log('\n📋 Le dashboard devrait maintenant afficher:');
    console.log('   - Les produits éligibles du client');
    console.log('   - Les simulations récentes');
    console.log('   - Les gains potentiels calculés');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testDashboardAPI(); 
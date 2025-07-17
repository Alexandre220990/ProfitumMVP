const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFinalQuery() {
  console.log('🔍 Test de la requête finale corrigée...');
  
  try {
    const { data, error, count } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        expert_id,
        produitId,
        statut,
        montantFinal,
        tauxFinal,
        dureeFinale,
        created_at,
        updated_at,
        current_step,
        progress,
        simulationId,
        metadata,
        notes,
        priorite,
        dateEligibilite,
        Client:Client!inner(
          id,
          email,
          company_name,
          phone_number,
          name,
          city,
          secteurActivite,
          nombreEmployes,
          revenuAnnuel
        ),
        ProduitEligible:ProduitEligible!inner(
          id,
          nom,
          description,
          categorie,
          montant_min,
          montant_max,
          taux_min,
          taux_max,
          duree_min,
          duree_max
        ),
        Simulation:Simulation(
          id,
          created_at
        )
      `)
      .limit(3);

    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }

    console.log('✅ Données récupérées:', data?.length || 0);
    console.log('📊 Premier dossier:', JSON.stringify(data?.[0], null, 2));
    
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

testFinalQuery(); 
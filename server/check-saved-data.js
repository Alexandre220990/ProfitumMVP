const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseService = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkSavedData() {
  console.log('🔍 Vérification des données sauvegardées\n');

  const testClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Vérifier les simulations récentes
    console.log('1️⃣ Simulations récentes pour le client...');
    
    const { data: simulations, error: simError } = await supabaseService
      .from('Simulation')
      .select('*')
      .eq('clientId', testClientId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (simError) {
      console.log(`❌ Erreur simulations: ${simError.message}`);
    } else {
      console.log(`✅ ${simulations.length} simulations trouvées:`);
      simulations.forEach((sim, index) => {
        console.log(`   ${index + 1}. ID: ${sim.id}`);
        console.log(`      Type: ${sim.type}`);
        console.log(`      Statut: ${sim.statut}`);
        console.log(`      Score: ${sim.score}`);
        console.log(`      Créé le: ${sim.created_at}`);
        console.log('');
      });
    }

    // 2. Vérifier les produits éligibles
    console.log('2️⃣ Produits éligibles pour le client...');
    
    const { data: produits, error: prodError } = await supabaseService
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible (
          nom,
          description
        ),
        Simulation (
          id,
          type,
          created_at
        )
      `)
      .eq('clientId', testClientId)
      .order('created_at', { ascending: false });

    if (prodError) {
      console.log(`❌ Erreur produits: ${prodError.message}`);
    } else {
      console.log(`✅ ${produits.length} produits éligibles trouvés:`);
      produits.forEach((prod, index) => {
        console.log(`   ${index + 1}. ID: ${prod.id}`);
        console.log(`      Produit: ${prod.ProduitEligible?.nom || 'N/A'}`);
        console.log(`      Statut: ${prod.statut}`);
        console.log(`      Montant: ${prod.montantFinal}€`);
        console.log(`      Taux: ${prod.tauxFinal}`);
        console.log(`      Durée: ${prod.dureeFinale} mois`);
        console.log(`      Simulation: ${prod.Simulation?.id || 'N/A'}`);
        console.log(`      Créé le: ${prod.created_at}`);
        console.log('');
      });
    }

    // 3. Vérifier les données du client
    console.log('3️⃣ Données du client...');
    
    const { data: client, error: clientError } = await supabaseService
      .from('Client')
      .select('*')
      .eq('id', testClientId)
      .single();

    if (clientError) {
      console.log(`❌ Erreur client: ${clientError.message}`);
    } else {
      console.log('✅ Client trouvé:');
      console.log(`   - ID: ${client.id}`);
      console.log(`   - Email: ${client.email}`);
      console.log(`   - Company: ${client.company_name}`);
      console.log(`   - Username: ${client.username}`);
      console.log(`   - Statut: ${client.statut}`);
      console.log(`   - Dernière connexion: ${client.derniereConnexion}`);
      console.log('');
    }

    // 4. Résumé pour le dashboard
    console.log('4️⃣ Résumé pour le dashboard:');
    console.log(`   - Client: ${client?.username || 'N/A'} (${client?.email})`);
    console.log(`   - Simulations: ${simulations?.length || 0}`);
    console.log(`   - Produits éligibles: ${produits?.length || 0}`);
    
    if (produits && produits.length > 0) {
      const totalGain = produits.reduce((sum, p) => sum + (p.montantFinal || 0), 0);
      console.log(`   - Gain total potentiel: ${totalGain.toLocaleString()}€`);
      
      const produitsByType = produits.reduce((acc, p) => {
        const nom = p.ProduitEligible?.nom || 'Inconnu';
        acc[nom] = (acc[nom] || 0) + 1;
        return acc;
      }, {});
      
      console.log('   - Répartition par type:');
      Object.entries(produitsByType).forEach(([nom, count]) => {
        console.log(`     * ${nom}: ${count} entrée(s)`);
      });
    }

    console.log('\n✅ Vérification terminée !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la vérification
checkSavedData(); 
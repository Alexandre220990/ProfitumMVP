const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugData() {
  console.log('🔍 Debug des données dans Supabase\n');

  const testClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Vérifier les produits éligibles
    console.log('1️⃣ Vérification des ClientProduitEligible...');
    const { data: clientProduits, error: clientError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', testClientId);

    if (clientError) {
      console.log(`❌ Erreur: ${clientError.message}`);
    } else {
      console.log(`✅ ${clientProduits?.length || 0} produits trouvés:`);
      if (clientProduits && clientProduits.length > 0) {
        clientProduits.forEach((prod, index) => {
          console.log(`   ${index + 1}. ID: ${prod.id}`);
          console.log(`      ClientId: ${prod.clientId}`);
          console.log(`      ProduitId: ${prod.produitId}`);
          console.log(`      Montant: ${prod.montantFinal}€`);
          console.log(`      Statut: ${prod.statut}`);
          console.log(`      Créé le: ${prod.created_at}`);
          console.log('');
        });
      }
    }

    // 2. Vérifier les simulations
    console.log('2️⃣ Vérification des Simulation...');
    const { data: simulations, error: simError } = await supabase
      .from('Simulation')
      .select('*')
      .eq('clientId', testClientId)
      .order('created_at', { ascending: false });

    if (simError) {
      console.log(`❌ Erreur: ${simError.message}`);
    } else {
      console.log(`✅ ${simulations?.length || 0} simulations trouvées:`);
      if (simulations && simulations.length > 0) {
        simulations.forEach((sim, index) => {
          console.log(`   ${index + 1}. ID: ${sim.id}`);
          console.log(`      Type: ${sim.type}`);
          console.log(`      Statut: ${sim.statut}`);
          console.log(`      Score: ${sim.score}`);
          console.log(`      Créé le: ${sim.created_at}`);
          console.log('');
        });
      }
    }

    // 3. Vérifier les produits éligibles de base
    console.log('3️⃣ Vérification des ProduitEligible...');
    const { data: produits, error: prodError } = await supabase
      .from('ProduitEligible')
      .select('*')
      .limit(5);

    if (prodError) {
      console.log(`❌ Erreur: ${prodError.message}`);
    } else {
      console.log(`✅ ${produits?.length || 0} produits de base trouvés:`);
      if (produits && produits.length > 0) {
        produits.forEach((prod, index) => {
          console.log(`   ${index + 1}. ID: ${prod.id}`);
          console.log(`      Nom: ${prod.nom}`);
          console.log(`      Description: ${prod.description?.substring(0, 50)}...`);
          console.log('');
        });
      }
    }

    // 4. Test de la requête join
    console.log('4️⃣ Test de la requête join...');
    if (clientProduits && clientProduits.length > 0) {
      const produitIds = clientProduits.map(cp => cp.produitId);
      console.log(`   ProduitIds à rechercher: ${produitIds.join(', ')}`);
      
      const { data: produitsDetails, error: joinError } = await supabase
        .from('ProduitEligible')
        .select('*')
        .in('id', produitIds);

      if (joinError) {
        console.log(`   ❌ Erreur join: ${joinError.message}`);
      } else {
        console.log(`   ✅ ${produitsDetails?.length || 0} produits trouvés via join`);
      }
    }

    console.log('\n✅ Debug terminé !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

debugData(); 
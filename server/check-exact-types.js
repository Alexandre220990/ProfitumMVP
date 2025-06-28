const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkExactTypes() {
  console.log('🔍 Vérification des types exacts des colonnes\n');
  
  try {
    // 1. Vérifier les types de Client
    console.log('1️⃣ Types de la table Client...');
    
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('id, auth_id, email')
      .limit(1);

    if (clientError) {
      console.log(`❌ Erreur Client: ${clientError.message}`);
    } else if (client.length > 0) {
      const c = client[0];
      console.log('✅ Types des colonnes Client:');
      console.log(`   - id: ${typeof c.id} (${c.id})`);
      console.log(`   - auth_id: ${typeof c.auth_id} (${c.auth_id})`);
      console.log(`   - email: ${typeof c.email} (${c.email})`);
      
      // Vérifier si ce sont des UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      console.log(`   - id est UUID: ${uuidRegex.test(c.id)}`);
      console.log(`   - auth_id est UUID: ${uuidRegex.test(c.auth_id)}`);
    }

    // 2. Vérifier les types de Simulation
    console.log('\n2️⃣ Types de la table Simulation...');
    
    const { data: simulation, error: simError } = await supabase
      .from('Simulation')
      .select('id, clientId')
      .limit(1);

    if (simError) {
      console.log(`❌ Erreur Simulation: ${simError.message}`);
    } else if (simulation.length > 0) {
      const s = simulation[0];
      console.log('✅ Types des colonnes Simulation:');
      console.log(`   - id: ${typeof s.id} (${s.id})`);
      console.log(`   - clientId: ${typeof s.clientId} (${s.clientId})`);
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      console.log(`   - id est UUID: ${uuidRegex.test(s.id)}`);
      console.log(`   - clientId est UUID: ${uuidRegex.test(s.clientId)}`);
    } else {
      console.log('⚠️ Table Simulation vide');
    }

    // 3. Vérifier les types de ClientProduitEligible
    console.log('\n3️⃣ Types de la table ClientProduitEligible...');
    
    const { data: produit, error: produitError } = await supabase
      .from('ClientProduitEligible')
      .select('id, clientId, produitId, simulationId')
      .limit(1);

    if (produitError) {
      console.log(`❌ Erreur ClientProduitEligible: ${produitError.message}`);
    } else if (produit.length > 0) {
      const p = produit[0];
      console.log('✅ Types des colonnes ClientProduitEligible:');
      console.log(`   - id: ${typeof p.id} (${p.id})`);
      console.log(`   - clientId: ${typeof p.clientId} (${p.clientId})`);
      console.log(`   - produitId: ${typeof p.produitId} (${p.produitId})`);
      console.log(`   - simulationId: ${typeof p.simulationId} (${p.simulationId})`);
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      console.log(`   - id est UUID: ${uuidRegex.test(p.id)}`);
      console.log(`   - clientId est UUID: ${uuidRegex.test(p.clientId)}`);
      console.log(`   - produitId est UUID: ${uuidRegex.test(p.produitId)}`);
      console.log(`   - simulationId est UUID: ${uuidRegex.test(p.simulationId)}`);
    } else {
      console.log('⚠️ Table ClientProduitEligible vide');
    }

    console.log('\n✅ Vérification des types terminée !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
checkExactTypes(); 
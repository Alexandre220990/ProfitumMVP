const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testPermissions() {
  console.log('🔍 Test des permissions et RLS\n');

  const testClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Test de lecture simple
    console.log('1️⃣ Test de lecture simple...');
    
    const { data: readData, error: readError } = await supabase
      .from('Client')
      .select('id, email, username')
      .eq('id', testClientId);

    if (readError) {
      console.log(`❌ Erreur lecture: ${readError.message}`);
      return;
    }

    console.log(`✅ Lecture réussie: ${readData.length} lignes trouvées`);
    if (readData.length > 0) {
      console.log('   Données:', readData[0]);
    }

    // 2. Test de mise à jour simple
    console.log('\n2️⃣ Test de mise à jour simple...');
    
    const { data: updateData, error: updateError } = await supabase
      .from('Client')
      .update({ 
        notes: 'Test simple ' + new Date().toISOString() 
      })
      .eq('id', testClientId)
      .select('id, notes');

    if (updateError) {
      console.log(`❌ Erreur mise à jour: ${updateError.message}`);
      console.log('Détails:', updateError);
    } else {
      console.log(`✅ Mise à jour réussie: ${updateData.length} lignes modifiées`);
      if (updateData.length > 0) {
        console.log('   Données mises à jour:', updateData[0]);
      }
    }

    // 3. Test avec une autre table (Simulation)
    console.log('\n3️⃣ Test avec la table Simulation...');
    
    const { data: simData, error: simError } = await supabase
      .from('Simulation')
      .select('*')
      .limit(1);

    if (simError) {
      console.log(`❌ Erreur Simulation: ${simError.message}`);
    } else {
      console.log(`✅ Lecture Simulation réussie: ${simData.length} lignes`);
    }

    // 4. Test d'insertion dans Simulation
    console.log('\n4️⃣ Test d\'insertion dans Simulation...');
    
    const { data: insertData, error: insertError } = await supabase
      .from('Simulation')
      .insert({
        clientId: testClientId,
        statut: 'test',
        type: 'test',
        dateCreation: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        Answers: { test: true },
        score: 100,
        tempsCompletion: 60
      })
      .select('id, clientId, statut');

    if (insertError) {
      console.log(`❌ Erreur insertion: ${insertError.message}`);
    } else {
      console.log(`✅ Insertion Simulation réussie: ${insertData.length} lignes`);
      if (insertData.length > 0) {
        console.log('   Données insérées:', insertData[0]);
      }
    }

    // 5. Test de mise à jour avec retour de toutes les colonnes
    console.log('\n5️⃣ Test de mise à jour avec retour complet...');
    
    const { data: fullUpdateData, error: fullUpdateError } = await supabase
      .from('Client')
      .update({ 
        metadata: { 
          lastTest: new Date().toISOString(),
          testType: 'permissions'
        }
      })
      .eq('id', testClientId)
      .select('*');

    if (fullUpdateError) {
      console.log(`❌ Erreur mise à jour complète: ${fullUpdateError.message}`);
    } else {
      console.log(`✅ Mise à jour complète réussie: ${fullUpdateData.length} lignes`);
      if (fullUpdateData.length > 0) {
        console.log('   Colonnes mises à jour:', Object.keys(fullUpdateData[0]).length);
      }
    }

    console.log('\n✅ Test des permissions terminé !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testPermissions(); 
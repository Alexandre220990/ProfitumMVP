const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testClientTable() {
  console.log('🧪 Test de la table Client avec les bons noms de colonnes\n');

  const testClientId = '0538de29-4287-4c28-b76a-b65ef993f393';
  
  try {
    // 1. Vérifier la structure de la table Client
    console.log('1️⃣ Vérification de la structure de la table Client...');
    
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('*')
      .eq('id', testClientId)
      .single();

    if (clientError) {
      console.log(`❌ Erreur lors de la récupération du client: ${clientError.message}`);
      return;
    }

    console.log('✅ Client trouvé:');
    console.log(`   - ID: ${client.id}`);
    console.log(`   - Nom: ${client.nom}`);
    console.log(`   - Email: ${client.email}`);
    console.log(`   - Nombre d'employés: ${client.nombreEmployes}`);
    console.log(`   - Statut: ${client.statut || 'non défini'}`);

    // 2. Tester la mise à jour avec les bons noms de colonnes
    console.log('\n2️⃣ Test de mise à jour avec les bons noms...');
    
    const updateData = {
      nombreEmployes: 25,           // camelCase correct
      secteurActivite: 'Technologie',
      chiffreAffaires: 1500000.00,  // camelCase correct
      statut: 'actif',
      derniereConnexion: new Date().toISOString(),
      notes: 'Client testé via script',
      metadata: {
        source: 'test-script',
        version: '1.0'
      }
    };

    console.log('📝 Données de mise à jour:', JSON.stringify(updateData, null, 2));

    const { data: updatedClient, error: updateError } = await supabase
      .from('Client')
      .update(updateData)
      .eq('id', testClientId)
      .select()
      .single();

    if (updateError) {
      console.log(`❌ Erreur de mise à jour: ${updateError.message}`);
      console.log('Détails:', updateError);
    } else {
      console.log(`✅ Client mis à jour avec succès!`);
      console.log('📊 Nouvelles données:');
      console.log(`   - Nombre d'employés: ${updatedClient.nombreEmployes}`);
      console.log(`   - Secteur: ${updatedClient.secteurActivite}`);
      console.log(`   - CA: ${updatedClient.chiffreAffaires}€`);
      console.log(`   - Statut: ${updatedClient.statut}`);
      console.log(`   - Dernière connexion: ${updatedClient.derniereConnexion}`);
    }

    // 3. Vérifier que les contraintes fonctionnent
    console.log('\n3️⃣ Test des contraintes...');
    
    // Test avec nombreEmployes négatif (doit échouer)
    const { error: constraintError } = await supabase
      .from('Client')
      .update({ nombreEmployes: -5 })
      .eq('id', testClientId);

    if (constraintError) {
      console.log(`✅ Contrainte nombreEmployes respectée: ${constraintError.message}`);
    } else {
      console.log(`❌ Contrainte nombreEmployes non respectée`);
    }

    // Test avec statut invalide (doit échouer)
    const { error: statutError } = await supabase
      .from('Client')
      .update({ statut: 'invalide' })
      .eq('id', testClientId);

    if (statutError) {
      console.log(`✅ Contrainte statut respectée: ${statutError.message}`);
    } else {
      console.log(`❌ Contrainte statut non respectée`);
    }

    console.log('\n✅ Test de la table Client terminé !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testClientTable(); 
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkClientStructure() {
  console.log('🔍 Vérification de la structure de la table Client\n');
  
  try {
    // 1. Récupérer toutes les colonnes de la table Client
    console.log('1️⃣ Structure de la table Client...');
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'Client' });

    if (columnsError) {
      console.log(`❌ Erreur RPC: ${columnsError.message}`);
      
      // Fallback : essayer de récupérer une ligne pour voir les colonnes
      console.log('\n2️⃣ Fallback : récupération d\'une ligne...');
      const { data: sampleRow, error: sampleError } = await supabase
        .from('Client')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log(`❌ Erreur sample: ${sampleError.message}`);
        return;
      }

      if (sampleRow.length > 0) {
        console.log('✅ Colonnes trouvées dans la première ligne:');
        Object.keys(sampleRow[0]).forEach(col => {
          console.log(`   - ${col}: ${typeof sampleRow[0][col]}`);
        });
      } else {
        console.log('⚠️ Table Client vide');
      }
    } else {
      console.log('✅ Colonnes de la table Client:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    // 3. Lister tous les clients avec les colonnes existantes
    console.log('\n3️⃣ Liste des clients...');
    const { data: allClients, error: listError } = await supabase
      .from('Client')
      .select('*')
      .limit(5);

    if (listError) {
      console.log(`❌ Erreur liste: ${listError.message}`);
      return;
    }

    console.log(`✅ ${allClients.length} clients trouvés:`);
    allClients.forEach((client, index) => {
      console.log(`\n   Client ${index + 1}:`);
      Object.entries(client).forEach(([key, value]) => {
        console.log(`      ${key}: ${value}`);
      });
    });

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
checkClientStructure(); 
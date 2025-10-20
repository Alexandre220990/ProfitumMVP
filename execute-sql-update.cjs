/**
 * Script pour exécuter le SQL de mise à jour via l'API REST Supabase
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

async function executeSQL() {
  console.log('\n🔧 Exécution du SQL de mise à jour...\n');

  // Lire le fichier SQL
  const sqlFilePath = path.join(__dirname, 'update-documents-stats-function.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  // Utiliser l'API REST de Supabase
  const url = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erreur HTTP:', response.status);
      console.error(error);
      
      // Méthode alternative : utiliser PostgREST directement
      console.log('\n⚠️  L\'API REST ne supporte pas exec_sql');
      console.log('📋 Solution : Copier-coller le SQL dans Supabase Dashboard\n');
      console.log('📄 Fichier à exécuter: update-documents-stats-function.sql');
      console.log('\n' + '='.repeat(70));
      console.log('CONTENU À COPIER:');
      console.log('='.repeat(70) + '\n');
      console.log(sqlContent);
      console.log('\n' + '='.repeat(70) + '\n');
      
      return false;
    }

    const data = await response.json();
    console.log('✅ SQL exécuté avec succès');
    console.log('📊 Résultat:', data);
    
    return true;

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    // Afficher le SQL pour copier-coller manuel
    console.log('\n📋 Veuillez exécuter ce SQL manuellement dans Supabase Dashboard:\n');
    console.log('='.repeat(70));
    console.log(sqlContent);
    console.log('='.repeat(70) + '\n');
    
    return false;
  }
}

async function verifyUpdate() {
  console.log('🧪 Vérification de la mise à jour...\n');
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data, error } = await supabase.rpc('get_documents_stats');

    if (error) {
      console.error('❌ Erreur:', error.message);
      return false;
    }

    // Vérifier la structure
    const hasCorrectStructure = 
      data.total_files !== undefined &&
      data.bucket_stats !== undefined;

    if (hasCorrectStructure) {
      console.log('✅ Fonction mise à jour avec succès!\n');
      console.log('📊 Nouvelles statistiques:\n');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n');
      return true;
    } else {
      console.log('⚠️  La structure n\'a pas encore été mise à jour\n');
      return false;
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║        Mise à jour de get_documents_stats via API            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Essayer d'exécuter le SQL
  const executed = await executeSQL();

  if (executed) {
    // Vérifier la mise à jour
    await verifyUpdate();
  } else {
    console.log('\n⚠️  Impossible d\'exécuter automatiquement.');
    console.log('   Veuillez copier le contenu du fichier update-documents-stats-function.sql');
    console.log('   et l\'exécuter dans Supabase Dashboard → SQL Editor\n');
  }
}

main().catch(console.error);


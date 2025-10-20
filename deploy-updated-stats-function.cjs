/**
 * Script pour mettre à jour la fonction get_documents_stats
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     Mise à jour de la fonction get_documents_stats           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Lire le fichier SQL
  const sqlFilePath = path.join(__dirname, 'update-documents-stats-function.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  console.log('📄 Fichier SQL:', path.basename(sqlFilePath));
  console.log('📏 Taille:', sqlContent.length, 'caractères\n');

  // Diviser le SQL en commandes individuelles
  const commands = sqlContent
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

  console.log('📝 Nombre de commandes SQL:', commands.length, '\n');
  console.log('⚠️  IMPORTANT: Ce script ne peut pas exécuter du DDL directement.');
  console.log('   Vous devez exécuter le SQL manuellement via Supabase Dashboard.\n');
  console.log('📋 Instructions:');
  console.log('   1. Ouvrez Supabase Dashboard → SQL Editor');
  console.log('   2. Copiez le contenu du fichier update-documents-stats-function.sql');
  console.log('   3. Exécutez la requête');
  console.log('   4. Vérifiez avec ce script\n');

  // Tester la fonction actuelle
  console.log('🧪 Test de la fonction actuelle...\n');

  try {
    const { data, error } = await supabase.rpc('get_documents_stats');

    if (error) {
      console.error('❌ Erreur:', error.message);
      console.log('\n   La fonction n\'existe pas ou a une erreur.\n');
      return;
    }

    console.log('✅ Fonction trouvée et opérationnelle\n');
    console.log('📊 Structure actuelle des données:\n');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');

    // Vérifier la structure
    const expectedKeys = [
      'total_files',
      'total_size', 
      'files_by_category',
      'files_by_status',
      'files_by_user_type',
      'recent_activity',
      'system_health',
      'bucket_stats'
    ];

    const hasCorrectStructure = expectedKeys.every(key => key in data);

    if (hasCorrectStructure) {
      console.log('✅ La structure correspond au format attendu par le frontend\n');
      
      // Vérifier bucket_stats en détail
      if (data.bucket_stats) {
        console.log('✅ bucket_stats présent:');
        console.log('   - client_bucket:', data.bucket_stats.client_bucket || 0);
        console.log('   - expert_bucket:', data.bucket_stats.expert_bucket || 0);
        console.log('   - admin_bucket:', data.bucket_stats.admin_bucket || 0);
        console.log('   - public_bucket:', data.bucket_stats.public_bucket || 0);
        console.log('\n╔═══════════════════════════════════════════════════════════════╗');
        console.log('║              ✅ FONCTION À JOUR ET OPÉRATIONNELLE            ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝\n');
      } else {
        console.log('⚠️  bucket_stats manquant, mise à jour recommandée\n');
      }
    } else {
      console.log('⚠️  Structure incorrecte. Clés manquantes:');
      expectedKeys.forEach(key => {
        if (!(key in data)) {
          console.log('   ❌', key);
        }
      });
      console.log('\n📋 Action: Exécutez update-documents-stats-function.sql\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

main().catch(console.error);


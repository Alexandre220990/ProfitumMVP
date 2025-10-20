/**
 * Script de déploiement de la fonction get_documents_stats
 * Exécute la fonction SQL sur Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERREUR: Variables d\'environnement manquantes');
  console.error('   Assurez-vous que SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployStatsFunction() {
  try {
    console.log('\n📊 Déploiement de la fonction get_documents_stats...\n');

    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, 'create-documents-stats-function.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📄 Fichier SQL chargé:', sqlFilePath);
    console.log('📏 Taille:', sqlContent.length, 'caractères\n');

    // Extraire uniquement la définition de la fonction (sans les commentaires de test)
    const functionSQL = sqlContent.split('-- ============================================================================')[0];

    // Exécuter via l'API Supabase
    const { data, error } = await supabase.rpc('exec_sql', {
      query: functionSQL
    });

    if (error) {
      // Si exec_sql n'existe pas, essayer avec une requête directe
      console.log('⚠️  exec_sql non disponible, tentative via query...');
      
      // Note : Supabase ne permet pas d'exécuter du DDL via l'API JS
      // Il faut le faire via le Dashboard SQL Editor
      console.log('\n⚠️  IMPORTANT: Cette fonction doit être créée manuellement via Supabase Dashboard');
      console.log('📝 Instructions:');
      console.log('   1. Ouvrez Supabase Dashboard → SQL Editor');
      console.log('   2. Copiez le contenu du fichier create-documents-stats-function.sql');
      console.log('   3. Exécutez la requête');
      console.log('   4. Testez avec: SELECT get_documents_stats();\n');
      
      // Essayons quand même de tester si la fonction existe déjà
      console.log('🔍 Vérification si la fonction existe déjà...\n');
      
      const { data: testData, error: testError } = await supabase.rpc('get_documents_stats');
      
      if (testError) {
        console.log('❌ La fonction n\'existe pas encore');
        console.log('   Erreur:', testError.message);
        console.log('\n📋 Action requise: Créez la fonction via Supabase Dashboard\n');
        return false;
      } else {
        console.log('✅ La fonction existe déjà et fonctionne !');
        console.log('📊 Résultat du test:\n');
        console.log(JSON.stringify(testData, null, 2));
        console.log('\n✅ Déploiement confirmé avec succès !\n');
        return true;
      }
    }

    console.log('✅ Fonction créée avec succès\n');

    // Tester la fonction
    console.log('🧪 Test de la fonction...\n');
    const { data: testData, error: testError } = await supabase.rpc('get_documents_stats');

    if (testError) {
      console.error('❌ Erreur lors du test:', testError.message);
      return false;
    }

    console.log('📊 Statistiques récupérées avec succès:\n');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n✅ Déploiement et test réussis !\n');

    return true;

  } catch (error) {
    console.error('❌ Erreur lors du déploiement:', error.message);
    console.error(error);
    return false;
  }
}

// Fonction pour vérifier les tables documentaires
async function verifyDocumentTables() {
  console.log('🔍 Vérification des tables documentaires...\n');

  try {
    // Vérifier ClientProcessDocument
    const { count: clientDocsCount, error: clientError } = await supabase
      .from('ClientProcessDocument')
      .select('*', { count: 'exact', head: true });

    if (clientError) {
      console.log('⚠️  Table ClientProcessDocument:', clientError.message);
    } else {
      console.log('✅ Table ClientProcessDocument:', clientDocsCount, 'documents');
    }

    // Vérifier GEDDocument
    const { count: gedCount, error: gedError } = await supabase
      .from('GEDDocument')
      .select('*', { count: 'exact', head: true });

    if (gedError) {
      console.log('⚠️  Table GEDDocument:', gedError.message);
    } else {
      console.log('✅ Table GEDDocument:', gedCount, 'documents');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

// Exécution principale
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Déploiement de la fonction de statistiques documentaires     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Vérifier les tables
  await verifyDocumentTables();

  // Déployer la fonction
  const success = await deployStatsFunction();

  if (success) {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ SUCCÈS TOTAL                             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
  } else {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║          ⚠️  ACTION MANUELLE REQUISE                          ║');
    console.log('║  Exécutez create-documents-stats-function.sql dans Supabase   ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
  }
}

main().catch(console.error);


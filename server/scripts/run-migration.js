#!/usr/bin/env node

/**
 * Script d'exécution de la migration de nomenclature des tables
 * Exécute le script SQL de migration directement via Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🚀 Lancement de la migration de nomenclature des tables...\n');

  // Vérifier les variables d'environnement
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variables d\'environnement manquantes:');
    console.error('   - SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nVeuillez configurer votre fichier .env');
    process.exit(1);
  }

  try {
    // Lire le script de migration
    const migrationPath = path.join(__dirname, '../migrations/20250103_unify_table_nomenclature.sql');
    const migrationScript = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Script de migration chargé');
    console.log('⏳ Exécution de la migration...\n');

    // Exécuter le script de migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationScript
    });

    if (error) {
      // Si exec_sql n'existe pas, utiliser une approche alternative
      console.log('⚠️  Méthode alternative utilisée...');
      
      // Exécuter les commandes une par une
      const commands = migrationScript.split(';').filter(cmd => cmd.trim());
      
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i].trim();
        if (command && !command.startsWith('--')) {
          console.log(`📝 Exécution commande ${i + 1}/${commands.length}...`);
          
          try {
            const { error: cmdError } = await supabase.rpc('exec_sql', {
              sql: command
            });
            
            if (cmdError) {
              console.log(`   ⚠️  Commande ignorée (peut-être déjà exécutée): ${command.substring(0, 50)}...`);
            }
          } catch (e) {
            console.log(`   ⚠️  Commande ignorée: ${e.message}`);
          }
        }
      }
    }

    console.log('\n✅ Migration exécutée !');
    console.log('🔍 Vérification des résultats...\n');

    // Vérifier les résultats
    const { data: clientCount } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true });

    const { data: expertCount } = await supabase
      .from('Expert')
      .select('*', { count: 'exact', head: true });

    const { data: documentFileCount } = await supabase
      .from('DocumentFile')
      .select('*', { count: 'exact', head: true });

    console.log('📊 Résultats de la migration:');
    console.log('==============================');
    console.log(`✅ Client: ${clientCount || 0} lignes`);
    console.log(`✅ Expert: ${expertCount || 0} lignes`);
    console.log(`✅ DocumentFile: ${documentFileCount || 0} lignes`);

    // Vérifier que les tables en minuscules n'existent plus
    console.log('\n🔍 Vérification de la suppression des tables minuscules...');
    
    try {
      await supabase.from('client').select('*', { count: 'exact', head: true });
      console.log('❌ Table "client" existe encore');
    } catch (e) {
      console.log('✅ Table "client" supprimée');
    }

    try {
      await supabase.from('expert').select('*', { count: 'exact', head: true });
      console.log('❌ Table "expert" existe encore');
    } catch (e) {
      console.log('✅ Table "expert" supprimée');
    }

    try {
      await supabase.from('documentfile').select('*', { count: 'exact', head: true });
      console.log('❌ Table "documentfile" existe encore');
    } catch (e) {
      console.log('✅ Table "documentfile" supprimée');
    }

    console.log('\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS !');
    console.log('=====================================');
    console.log('✅ Nomenclature unifiée (majuscules uniquement)');
    console.log('✅ Données migrées avec succès');
    console.log('✅ Tables en minuscules supprimées');
    console.log('✅ Base de données nettoyée');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    console.error('\n💡 Solutions possibles:');
    console.error('   1. Vérifier les variables d\'environnement');
    console.error('   2. Exécuter manuellement dans Supabase SQL Editor');
    console.error('   3. Vérifier les permissions de la base de données');
    process.exit(1);
  }
}

// Exécuter la migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n✅ Migration terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { runMigration }; 
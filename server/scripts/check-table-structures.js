#!/usr/bin/env node

/**
 * Script pour vérifier les structures exactes des tables
 * Identifie les noms de colonnes corrects
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructures() {
  console.log('🔍 Vérification des structures exactes des tables...\n');

  const tablesToCheck = [
    'Client', 'Expert', 'DocumentFile', 'client', 'expert', 'documentfile'
  ];

  for (const tableName of tablesToCheck) {
    console.log(`📊 Structure de la table: ${tableName}`);
    console.log('=' .repeat(50));
    
    try {
      // Récupérer un enregistrement pour voir les colonnes
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
        continue;
      }

      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`   ✅ Colonnes (${columns.length}):`);
        columns.forEach((col, index) => {
          console.log(`      ${index + 1}. ${col}`);
        });
      } else {
        console.log(`   ⚠️  Table vide - pas de colonnes visibles`);
      }

      // Compter les lignes
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      console.log(`   📊 Nombre de lignes: ${count || 0}`);
      console.log('');

    } catch (error) {
      console.log(`   ❌ Erreur lors de l'analyse: ${error.message}`);
      console.log('');
    }
  }

  console.log('🎯 RECOMMANDATIONS:');
  console.log('===================');
  console.log('1. Vérifier les noms exacts des colonnes');
  console.log('2. Adapter le script de migration');
  console.log('3. Tester sur une table à la fois');
}

// Exécuter la vérification
if (require.main === module) {
  checkTableStructures()
    .then(() => {
      console.log('\n✅ Vérification terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = { checkTableStructures }; 
#!/usr/bin/env node

/**
 * Script de vérification de la nomenclature des tables
 * Vérifie les tables en majuscules vs minuscules avant migration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyTableNomenclature() {
  console.log('🔍 Vérification de la nomenclature des tables...\n');

  // Tables à vérifier
  const tablesToCheck = [
    { name: 'Client', lowercase: 'client' },
    { name: 'Expert', lowercase: 'expert' },
    { name: 'DocumentFile', lowercase: 'documentfile' },
    { name: 'ProduitEligible', lowercase: 'produiteligible' },
    { name: 'ClientProduitEligible', lowercase: 'clientproduiteligible' }
  ];

  const results = {};

  for (const table of tablesToCheck) {
    console.log(`📊 Vérification de ${table.name} vs ${table.lowercase}...`);
    
    try {
      // Vérifier la table en majuscules - compter toutes les lignes
      const { count: upperCount, error: upperError } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      // Vérifier la table en minuscules - compter toutes les lignes
      const { count: lowerCount, error: lowerError } = await supabase
        .from(table.lowercase)
        .select('*', { count: 'exact', head: true });

      results[table.name] = {
        uppercase: {
          exists: !upperError,
          count: upperCount || 0,
          error: upperError?.message
        },
        lowercase: {
          exists: !lowerError,
          count: lowerCount || 0,
          error: lowerError?.message
        }
      };

      console.log(`   ✅ ${table.name}: ${results[table.name].uppercase.exists ? 'EXISTE' : 'N\'EXISTE PAS'} (${results[table.name].uppercase.count} lignes)`);
      console.log(`   ✅ ${table.lowercase}: ${results[table.name].lowercase.exists ? 'EXISTE' : 'N\'EXISTE PAS'} (${results[table.name].lowercase.count} lignes)`);

    } catch (error) {
      console.error(`   ❌ Erreur lors de la vérification de ${table.name}:`, error.message);
    }
  }

  // Résumé
  console.log('\n📋 RÉSUMÉ DE LA VÉRIFICATION:');
  console.log('================================');

  let hasDuplicates = false;
  let totalDataToMigrate = 0;

  for (const [tableName, result] of Object.entries(results)) {
    if (result.uppercase.exists && result.lowercase.exists) {
      hasDuplicates = true;
      totalDataToMigrate += result.lowercase.count;
      console.log(`⚠️  ${tableName}: DOUBLE NOMENCLATURE DÉTECTÉE`);
      console.log(`   - Table majuscule: ${result.uppercase.count} lignes`);
      console.log(`   - Table minuscule: ${result.lowercase.count} lignes`);
      
      if (result.lowercase.count > 0) {
        console.log(`   🔄 ${result.lowercase.count} lignes à migrer de la table minuscule`);
      }
    } else if (result.uppercase.exists && !result.lowercase.exists) {
      console.log(`✅ ${tableName}: OK (majuscule uniquement)`);
    } else if (!result.uppercase.exists && result.lowercase.exists) {
      console.log(`⚠️  ${tableName}: Table minuscule uniquement (à migrer)`);
    } else {
      console.log(`❌ ${tableName}: Aucune table trouvée`);
    }
  }

  console.log('\n🎯 RECOMMANDATIONS:');
  console.log('===================');

  if (hasDuplicates) {
    console.log(`📊 ${totalDataToMigrate} lignes à migrer au total`);
    if (totalDataToMigrate > 0) {
      console.log('✅ Migration recommandée: Utiliser le script de migration complet');
      console.log('⚠️  SAUVEGARDE OBLIGATOIRE avant migration');
    } else {
      console.log('✅ Nettoyage simple: Supprimer les tables minuscules vides');
    }
  } else {
    console.log('✅ Aucune duplication détectée - Nomenclature OK');
  }

  return results;
}

// Exécuter la vérification
if (require.main === module) {
  verifyTableNomenclature()
    .then(() => {
      console.log('\n✅ Vérification terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur lors de la vérification:', error);
      process.exit(1);
    });
}

module.exports = { verifyTableNomenclature }; 
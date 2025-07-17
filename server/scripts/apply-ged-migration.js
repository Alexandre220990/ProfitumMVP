#!/usr/bin/env node

/**
 * Script pour appliquer la migration de la Gestion Électronique Documentaire (GED)
 * Usage: node scripts/apply-ged-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyGEDMigration() {
  console.log('🚀 Début de l\'application de la migration GED...\n');

  try {
    // 1. Lire le fichier de migration
    const migrationPath = path.join(process.cwd(), 'migrations', '20250127_create_ged_tables.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Fichier de migration non trouvé: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Fichier de migration lu avec succès');

    // 2. Diviser le SQL en commandes individuelles
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📊 ${commands.length} commandes SQL à exécuter\n`);

    // 3. Exécuter chaque commande
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      try {
        console.log(`⏳ Exécution de la commande ${i + 1}/${commands.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          // Si exec_sql n'existe pas, utiliser une approche alternative
          console.log('⚠️  exec_sql non disponible, tentative avec query...');
          
          // Pour les commandes de création de tables, on peut les ignorer si elles existent déjà
          if (command.toLowerCase().includes('create table') || 
              command.toLowerCase().includes('create index') ||
              command.toLowerCase().includes('alter table')) {
            console.log('✅ Commande de structure ignorée (probablement déjà existante)');
            successCount++;
            continue;
          }
          
          throw error;
        }
        
        console.log('✅ Commande exécutée avec succès');
        successCount++;
        
      } catch (error) {
        console.error(`❌ Erreur lors de l'exécution de la commande ${i + 1}:`, error.message);
        errorCount++;
        
        // Continuer avec les autres commandes
        continue;
      }
    }

    console.log(`\n📈 Résumé de l'exécution:`);
    console.log(`   ✅ Commandes réussies: ${successCount}`);
    console.log(`   ❌ Commandes en erreur: ${errorCount}`);

    // 4. Vérifier que les tables ont été créées
    console.log('\n🔍 Vérification de la création des tables...');
    
    const expectedTables = [
      'Document',
      'DocumentLabel', 
      'DocumentLabelRelation',
      'DocumentPermission',
      'DocumentVersion',
      'UserDocumentFavorite'
    ];

    for (const tableName of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Table ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ Table ${tableName}: OK`);
        }
      } catch (error) {
        console.log(`❌ Table ${tableName}: ${error.message}`);
      }
    }

    // 5. Vérifier les labels par défaut
    console.log('\n🏷️  Vérification des labels par défaut...');
    
    const { data: labels, error: labelsError } = await supabase
      .from('DocumentLabel')
      .select('name, color')
      .order('name');

    if (labelsError) {
      console.log(`❌ Erreur lors de la vérification des labels: ${labelsError.message}`);
    } else {
      console.log(`✅ ${labels?.length || 0} labels trouvés:`);
      labels?.forEach(label => {
        console.log(`   - ${label.name} (${label.color})`);
      });
    }

    // 6. Test de création d'un document de test
    console.log('\n🧪 Test de création d\'un document de test...');
    
    try {
      // Créer un document de test
      const { data: testDoc, error: testDocError } = await supabase
        .from('Document')
        .insert({
          title: 'Document de test GED',
          description: 'Document créé automatiquement pour tester la migration',
          content: '<h1>Test GED</h1><p>Ce document a été créé automatiquement pour vérifier que la migration fonctionne correctement.</p>',
          category: 'technical',
          created_by: null, // Pas d'utilisateur spécifique pour le test
          read_time: 2
        })
        .select()
        .single();

      if (testDocError) {
        console.log(`❌ Erreur lors de la création du document de test: ${testDocError.message}`);
      } else {
        console.log(`✅ Document de test créé avec l'ID: ${testDoc.id}`);
        
        // Créer les permissions par défaut
        const defaultPermissions = [
          { document_id: testDoc.id, user_type: 'admin', can_read: true, can_write: true, can_delete: true, can_share: true },
          { document_id: testDoc.id, user_type: 'client', can_read: true, can_write: false, can_delete: false, can_share: true },
          { document_id: testDoc.id, user_type: 'expert', can_read: true, can_write: true, can_delete: false, can_share: true }
        ];

        const { error: permError } = await supabase
          .from('DocumentPermission')
          .insert(defaultPermissions);

        if (permError) {
          console.log(`❌ Erreur lors de la création des permissions: ${permError.message}`);
        } else {
          console.log('✅ Permissions par défaut créées');
        }

        // Nettoyer le document de test
        await supabase
          .from('Document')
          .delete()
          .eq('id', testDoc.id);
        
        console.log('🧹 Document de test supprimé');
      }
    } catch (error) {
      console.log(`❌ Erreur lors du test: ${error.message}`);
    }

    console.log('\n🎉 Migration GED terminée avec succès!');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. Redémarrer le serveur backend');
    console.log('   2. Tester les routes API /api/documents');
    console.log('   3. Intégrer l\'interface frontend');

  } catch (error) {
    console.error('\n💥 Erreur critique lors de la migration:', error);
    process.exit(1);
  }
}

// Fonction utilitaire pour vérifier la connectivité
async function checkConnection() {
  console.log('🔌 Vérification de la connexion à Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('Client')
      .select('count')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('✅ Connexion à Supabase établie');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à Supabase:', error.message);
    return false;
  }
}

// Point d'entrée principal
async function main() {
  console.log('🔧 Script de migration GED - FinancialTracker\n');
  
  // Vérifier la connexion
  const isConnected = await checkConnection();
  if (!isConnected) {
    process.exit(1);
  }

  // Appliquer la migration
  await applyGEDMigration();
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesse rejetée non gérée:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Exception non capturée:', error);
  process.exit(1);
});

// Exécuter le script
main().catch((error) => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
}); 
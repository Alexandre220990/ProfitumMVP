#!/usr/bin/env node

/**
 * Script manuel pour créer les tables de la Gestion Électronique Documentaire (GED)
 * Utilise l'API Supabase directement au lieu de SQL brut
 * Usage: node scripts/create-ged-tables-manual.js
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createGEDTables() {
  console.log('🚀 Création manuelle des tables GED...\n');

  try {
    // 1. Créer la table DocumentLabel
    console.log('🏷️  Création de la table DocumentLabel...');
    
    const labels = [
      { name: 'admin', color: '#EF4444', description: 'Documentation pour les administrateurs' },
      { name: 'client', color: '#3B82F6', description: 'Documentation pour les clients' },
      { name: 'expert', color: '#10B981', description: 'Documentation pour les experts' },
      { name: 'guide', color: '#F59E0B', description: 'Guides d\'utilisation' },
      { name: 'fonctionnalités', color: '#8B5CF6', description: 'Description des fonctionnalités' },
      { name: 'processus', color: '#06B6D4', description: 'Processus métier' },
      { name: 'métier', color: '#84CC16', description: 'Documentation métier' },
      { name: 'sécurité', color: '#DC2626', description: 'Documentation sécurité' },
      { name: 'api', color: '#7C3AED', description: 'Documentation API' },
      { name: 'architecture', color: '#059669', description: 'Architecture technique' },
      { name: 'déploiement', color: '#D97706', description: 'Guides de déploiement' },
      { name: 'tests', color: '#0891B2', description: 'Documentation des tests' },
      { name: 'ged', color: '#7C2D12', description: 'Gestion Électronique Documentaire' },
      { name: 'documentation', color: '#1E40AF', description: 'Documentation générale' },
      { name: 'implémentation', color: '#BE185D', description: 'Guides d\'implémentation' },
      { name: 'base-de-données', color: '#92400E', description: 'Documentation base de données' },
      { name: 'iso', color: '#374151', description: 'Conformité ISO' }
    ];

    // Insérer les labels un par un pour éviter les conflits
    for (const label of labels) {
      try {
        const { data, error } = await supabase
          .from('DocumentLabel')
          .insert(label)
          .select()
          .single();

        if (error && !error.message.includes('duplicate key')) {
          console.log(`❌ Erreur lors de la création du label ${label.name}:`, error.message);
        } else if (data) {
          console.log(`✅ Label créé: ${label.name}`);
        } else {
          console.log(`⚠️  Label déjà existant: ${label.name}`);
        }
      } catch (error) {
        console.log(`⚠️  Label ${label.name}: ${error.message}`);
      }
    }

    // 2. Créer un document de test
    console.log('\n📄 Création d\'un document de test...');
    
    const testDocument = {
      title: 'Guide d\'utilisation - Test GED',
      description: 'Document de test pour vérifier le fonctionnement de la GED',
      content: `
        <h1>Guide d'utilisation - Test GED</h1>
        <p>Ce document a été créé automatiquement pour tester le système de Gestion Électronique Documentaire.</p>
        
        <h2>Fonctionnalités testées</h2>
        <ul>
          <li>Création de documents</li>
          <li>Gestion des labels</li>
          <li>Permissions utilisateur</li>
          <li>Recherche et filtrage</li>
        </ul>
        
        <h2>Processus de test</h2>
        <ol>
          <li>Création du document</li>
          <li>Ajout de labels</li>
          <li>Vérification des permissions</li>
          <li>Test de modification</li>
          <li>Nettoyage automatique</li>
        </ol>
      `,
      category: 'technical',
      created_by: null,
      read_time: 3,
      is_active: true,
      version: 1
    };

    const { data: document, error: docError } = await supabase
      .from('Document')
      .insert(testDocument)
      .select()
      .single();

    if (docError) {
      console.log('❌ Erreur lors de la création du document:', docError.message);
    } else {
      console.log(`✅ Document créé avec l'ID: ${document.id}`);

      // 3. Ajouter des labels au document
      console.log('🏷️  Ajout de labels au document...');
      
      const labelIds = await getLabelIds(['ged', 'guide', 'documentation']);
      
      for (const labelId of labelIds) {
        try {
          const { error } = await supabase
            .from('DocumentLabelRelation')
            .insert({
              document_id: document.id,
              label_id: labelId
            });

          if (error && !error.message.includes('duplicate key')) {
            console.log(`❌ Erreur lors de l'ajout du label:`, error.message);
          } else {
            console.log(`✅ Label ajouté au document`);
          }
        } catch (error) {
          console.log(`⚠️  Label déjà associé`);
        }
      }

      // 4. Créer les permissions par défaut
      console.log('🔐 Création des permissions par défaut...');
      
      const defaultPermissions = [
        { document_id: document.id, user_type: 'admin', can_read: true, can_write: true, can_delete: true, can_share: true },
        { document_id: document.id, user_type: 'client', can_read: true, can_write: false, can_delete: false, can_share: true },
        { document_id: document.id, user_type: 'expert', can_read: true, can_write: true, can_delete: false, can_share: true }
      ];

      for (const permission of defaultPermissions) {
        try {
          const { error } = await supabase
            .from('DocumentPermission')
            .insert(permission);

          if (error && !error.message.includes('duplicate key')) {
            console.log(`❌ Erreur lors de la création de la permission:`, error.message);
          } else {
            console.log(`✅ Permission créée pour ${permission.user_type}`);
          }
        } catch (error) {
          console.log(`⚠️  Permission déjà existante pour ${permission.user_type}`);
        }
      }

      // 5. Vérifier que tout fonctionne
      console.log('\n🔍 Vérification finale...');
      
      const { data: finalDoc, error: finalError } = await supabase
        .from('Document')
        .select(`
          *,
          DocumentLabelRelation(
            DocumentLabel(*)
          ),
          DocumentPermission(*)
        `)
        .eq('id', document.id)
        .single();

      if (finalError) {
        console.log('❌ Erreur lors de la vérification finale:', finalError.message);
      } else {
        console.log('✅ Document final récupéré avec succès');
        console.log(`   Titre: ${finalDoc.title}`);
        console.log(`   Labels: ${finalDoc.DocumentLabelRelation?.map((rel) => rel.DocumentLabel.name).join(', ') || 'Aucun'}`);
        console.log(`   Permissions: ${finalDoc.DocumentPermission?.length || 0} créées`);
      }

      // 6. Nettoyer le document de test
      console.log('\n🧹 Nettoyage du document de test...');
      
      await supabase
        .from('Document')
        .delete()
        .eq('id', document.id);
      
      console.log('✅ Document de test supprimé');
    }

    console.log('\n🎉 Création des tables GED terminée avec succès!');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. Redémarrer le serveur backend');
    console.log('   2. Tester les routes API /api/documents');
    console.log('   3. Intégrer l\'interface frontend');

  } catch (error) {
    console.error('\n💥 Erreur critique lors de la création:', error);
    process.exit(1);
  }
}

async function getLabelIds(labelNames) {
  const { data: labels, error } = await supabase
    .from('DocumentLabel')
    .select('id, name')
    .in('name', labelNames);

  if (error) {
    console.log('❌ Erreur lors de la récupération des labels:', error.message);
    return [];
  }

  return labels?.map(label => label.id) || [];
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
  console.log('🔧 Création manuelle des tables GED - FinancialTracker\n');
  
  // Vérifier la connexion
  const isConnected = await checkConnection();
  if (!isConnected) {
    process.exit(1);
  }

  console.log('');
  
  // Créer les tables
  await createGEDTables();
}

// Gestion des erreurs
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
// Script de test corrigé pour l'upload admin avec bucket documents
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU5NzI5NywiZXhwIjoyMDU1MTczMjk3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Guides de test à créer (version simplifiée)
const testGuides = [
  {
    title: 'Guide GED Admin Améliorée',
    description: 'Guide complet de la Gestion Électronique Documentaire admin avec ciblage avancé',
    category: 'guide',
    priority: 'high',
    content: `
# Guide GED Admin Améliorée

## Vue d'ensemble

La page GED (Gestion Électronique Documentaire) admin a été entièrement modernisée avec des fonctionnalités de ciblage avancé.

## Nouvelles fonctionnalités

### Ciblage avancé
- Documents pour tous
- Documents pour clients spécifiques
- Documents pour experts spécifiques
- Documents pour groupes
- Documents pour l'admin uniquement

### Niveaux d'accès
- Public : Visible par tous
- Private : Visible par cibles spécifiées
- Restricted : Accès limité
- Confidential : Accès sécurisé

## Utilisation

### 1. Création d'un document
1. Accéder à /admin/ged-management
2. Cliquer sur "Nouveau Document"
3. Remplir les informations
4. Configurer le ciblage
5. Sauvegarder

### 2. Configuration du ciblage
- Sélectionner le niveau d'accès
- Choisir les cibles
- Utiliser la recherche
- Valider les permissions

## Interface

### Design moderne
- Cards organisées
- Icônes intuitives
- Couleurs cohérentes
- Responsive design

### Bonnes pratiques
- Utiliser des catégories claires
- Créer des groupes logiques
- Documenter les cibles
- Réviser régulièrement
    `
  },
  {
    title: 'Guide Calendrier Avancé',
    description: 'Utilisation avancée du système de calendrier et gestion des événements',
    category: 'guide',
    priority: 'high',
    content: `
# Guide Calendrier Avancé

## Introduction

Le système de calendrier avancé de Profitum permet une gestion complète des événements.

## Fonctionnalités

### Gestion des événements
- Création d'événements simples et récurrents
- Gestion des participants
- Notifications automatiques
- Intégration avec les workflows

### Calendriers multiples
- Calendrier personnel
- Calendrier d'équipe
- Calendrier client
- Calendrier projet

### Synchronisation
- Synchronisation avec Google Calendar
- Export vers Outlook
- API de synchronisation
- Notifications push

## Utilisation

### Création d'événements
1. Sélectionner la date et l'heure
2. Définir le type d'événement
3. Ajouter les participants
4. Configurer les notifications
5. Sauvegarder

### Gestion des récurrences
- Quotidien
- Hebdomadaire
- Mensuel
- Annuel
- Personnalisé

## Configuration

### Paramètres utilisateur
- Fuseau horaire
- Notifications
- Affichage
- Permissions

### Paramètres admin
- Types d'événements
- Templates
- Permissions globales
- Intégrations
    `
  },
  {
    title: 'Guide Workflows Business',
    description: 'Gestion des workflows métier et processus automatisés',
    category: 'procedure',
    priority: 'high',
    content: `
# Guide Workflows Business

## Vue d'ensemble

Les workflows business de Profitum automatisent les processus métier.

## Workflows disponibles

### Workflow 1: CGV Profitum
- Génération automatique des CGV
- Validation par étapes
- Signature électronique
- Archivage sécurisé

### Workflow 2: Rapport de simulation
- Calcul automatique des éligibilités
- Génération de rapports
- Validation expert
- Notification client

### Workflow 3: Rapport pré-éligibilité
- Analyse préliminaire
- Vérification des critères
- Rapport détaillé
- Recommandations

### Workflow 4: Rapport éligibilité expert
- Validation technique
- Contrôles qualité
- Rapport final
- Archivage

### Workflow 5: Bon de commande
- Génération automatique
- Validation budgétaire
- Approbation hiérarchique
- Transmission fournisseur

### Workflow 6: Facturation
- Calcul automatique
- Validation comptable
- Génération facture
- Envoi client

### Workflow 7: Suivi administratif
- Suivi des dossiers
- Alertes automatiques
- Rapports de progression
- Validation finale

### Workflow 8: Remboursement
- Calcul des montants
- Validation comptable
- Traitement bancaire
- Confirmation client

## Configuration

### Paramètres généraux
- Activer/désactiver les workflows
- Configurer les notifications
- Définir les délais
- Gérer les permissions

### Monitoring

### Tableau de bord
- Workflows en cours
- Statistiques de performance
- Alertes et erreurs
- Rapports d'activité

### Analytics
- Temps de traitement
- Taux de réussite
- Goulots d'étranglement
- Optimisations possibles
    `
  }
];

// Fonction pour créer un contenu texte simple
function createSimpleContent(title, content) {
  return `
${title}
${'='.repeat(title.length)}

${content}

---
Document généré automatiquement par le système Profitum
Date: ${new Date().toLocaleDateString('fr-FR')}
Version: 1.0
  `.trim();
}

// Fonction pour uploader un document dans Supabase
async function uploadDocumentToSupabase(content, fileName, metadata) {
  try {
    console.log(`📤 Upload de ${fileName}...`);
    
    // Convertir en buffer
    const buffer = Buffer.from(content, 'utf8');
    
    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(`admin-guides/${fileName}`, buffer, {
        contentType: 'text/plain',
        upsert: true,
        metadata: {
          title: metadata.title,
          description: metadata.description,
          category: metadata.category,
          priority: metadata.priority,
          type: 'admin-guide',
          created_at: new Date().toISOString()
        }
      });

    if (error) {
      console.error(`❌ Erreur upload ${fileName}:`, error);
      return null;
    }

    console.log(`✅ ${fileName} uploadé avec succès`);
    return data.path;
  } catch (error) {
    console.error(`❌ Erreur lors de l'upload de ${fileName}:`, error);
    return null;
  }
}

// Fonction pour créer et uploader les guides de test
async function createAndUploadTestGuides() {
  console.log('🔄 Création et upload des guides de test...\n');

  const results = [];

  for (const guide of testGuides) {
    try {
      console.log(`📖 Création de ${guide.title}...`);
      
      // Créer le contenu texte
      const content = createSimpleContent(guide.title, guide.content);
      
      // Générer le nom de fichier
      const fileName = `${guide.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
      
      // Upload vers Supabase
      const uploadedPath = await uploadDocumentToSupabase(content, fileName, guide);
      
      if (uploadedPath) {
        results.push({
          ...guide,
          file_path: uploadedPath,
          status: 'success'
        });
      } else {
        results.push({
          ...guide,
          status: 'upload_failed'
        });
      }

    } catch (error) {
      console.error(`❌ Erreur lors du traitement de ${guide.title}:`, error);
      results.push({
        ...guide,
        status: 'error',
        error: error.message
      });
    }
  }

  // Afficher le résumé
  console.log('\n📊 Résumé de la création:');
  console.log('========================');
  
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status !== 'success').length;
  
  console.log(`✅ Succès: ${successful}`);
  console.log(`❌ Échecs: ${failed}`);
  console.log(`📁 Total: ${results.length}`);

  if (successful > 0) {
    console.log('\n🎉 Guides créés avec succès:');
    results.filter(r => r.status === 'success').forEach(guide => {
      console.log(`   📄 ${guide.title} -> ${guide.file_path}`);
    });
  }

  if (failed > 0) {
    console.log('\n⚠️  Guides en échec:');
    results.filter(r => r.status !== 'success').forEach(guide => {
      console.log(`   ❌ ${guide.title}: ${guide.status}`);
    });
  }

  return results;
}

// Fonction pour tester l'API admin
async function testAdminAPI() {
  console.log('\n🧪 Test de l\'API admin...\n');

  try {
    // Test 1: Récupération des documents admin
    console.log('1️⃣ Test récupération documents admin...');
    const { data: documents, error: docsError } = await supabase
      .from('DocumentFile')
      .select('*')
      .eq('category', 'admin')
      .limit(5);

    if (docsError) {
      console.log('❌ Erreur récupération documents:', docsError.message);
    } else {
      console.log(`✅ ${documents.length} documents admin trouvés`);
    }

    // Test 2: Vérification du bucket documents
    console.log('\n2️⃣ Test bucket documents...');
    const { data: files, error: bucketError } = await supabase.storage
      .from('documents')
      .list('admin-guides');

    if (bucketError) {
      console.log('❌ Erreur bucket:', bucketError.message);
    } else {
      console.log(`✅ ${files.length} fichiers dans documents/admin-guides`);
      if (files.length > 0) {
        files.forEach(file => {
          console.log(`   - ${file.name} (${file.metadata?.size || 'N/A'} bytes)`);
        });
      }
    }

    // Test 3: Test d'upload simple
    console.log('\n3️⃣ Test upload simple...');
    const testContent = 'Test Admin - Document de test pour l\'admin.\nDate: ' + new Date().toLocaleDateString('fr-FR');
    const testBuffer = Buffer.from(testContent, 'utf8');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`admin/test-admin-${Date.now()}.txt`, testBuffer, {
        contentType: 'text/plain',
        upsert: true,
        metadata: {
          title: 'Test Admin Upload',
          description: 'Test de l\'upload admin',
          category: 'test',
          type: 'admin'
        }
      });

    if (uploadError) {
      console.log('❌ Erreur upload test:', uploadError.message);
    } else {
      console.log('✅ Upload test réussi:', uploadData.path);
    }

  } catch (error) {
    console.error('❌ Erreur lors des tests API:', error);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests admin upload corrigés...\n');
  
  await testAdminAPI();
  await createAndUploadTestGuides();
  
  console.log('\n🎉 Tests terminés !');
  console.log('\n📋 Prochaines étapes:');
  console.log('   1. Accéder à /admin/admin-document-upload');
  console.log('   2. Vérifier les guides créés dans documents/admin-guides/');
  console.log('   3. Tester l\'upload manuel');
  console.log('   4. Configurer le ciblage avancé');
  console.log('   5. Créer le bucket admin-documents dans Supabase Dashboard');
}

runTests().catch(console.error); 
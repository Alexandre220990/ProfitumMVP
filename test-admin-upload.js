// Script de test pour l'upload admin avec guides PDF
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU5NzI5NywiZXhwIjoyMDU1MTczMjk3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Guides de test à créer
const testGuides = [
  {
    title: 'Guide GED Admin Améliorée',
    description: 'Guide complet de la Gestion Électronique Documentaire admin avec ciblage avancé',
    category: 'guide',
    priority: 'high',
    content: `
# Guide GED Admin Améliorée

## Vue d'ensemble

La page GED (Gestion Électronique Documentaire) admin a été entièrement modernisée avec des fonctionnalités de ciblage avancé, permettant à l'administrateur de créer et gérer des documents avec un contrôle granulaire des accès.

## Nouvelles fonctionnalités

### Ciblage avancé
- **Documents pour tous** : Accès public à tous les utilisateurs
- **Documents pour clients spécifiques** : Ciblage individuel ou multiple
- **Documents pour experts spécifiques** : Ciblage individuel ou multiple  
- **Documents pour groupes** : Création et gestion de groupes mixtes
- **Documents pour l'admin uniquement** : Accès restreint

### Niveaux d'accès
- **Public** : Visible par tous les utilisateurs
- **Private** : Visible uniquement par les cibles spécifiées
- **Restricted** : Accès limité avec restrictions supplémentaires
- **Confidential** : Accès hautement sécurisé

## Utilisation

### 1. Création d'un nouveau document
1. Accéder à la page GED : /admin/ged-management
2. Cliquer sur "Nouveau Document"
3. Remplir les informations de base
4. Configurer le ciblage avancé
5. Sauvegarder

### 2. Configuration du ciblage
- Sélectionner le niveau d'accès
- Choisir les cibles (clients, experts, groupes)
- Utiliser la recherche avancée
- Valider les permissions

## Interface utilisateur

### Design moderne
- Cards organisées
- Icônes intuitives
- Couleurs cohérentes
- Responsive design

### Affichage des cibles
- Badges colorés
- Compteurs
- Aperçu compact
- Actions rapides

## Bonnes pratiques

### Organisation
1. Utiliser des catégories claires
2. Créer des groupes logiques
3. Documenter les cibles
4. Réviser régulièrement

### Sécurité
1. Principe du moindre privilège
2. Révision périodique
3. Audit des accès
4. Formation des utilisateurs
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

Le système de calendrier avancé de Profitum permet une gestion complète des événements, rendez-vous et planifications pour tous les utilisateurs.

## Fonctionnalités principales

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

## Utilisation avancée

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

### Intégrations
- Workflows automatiques
- Notifications système
- Rapports et analytics
- Export de données

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

Les workflows business de Profitum automatisent les processus métier pour améliorer l'efficacité et réduire les erreurs.

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

### Personnalisation
- Templates personnalisés
- Champs additionnels
- Validations spécifiques
- Intégrations externes

## Monitoring

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

// Fonction pour créer un PDF simple (simulation)
function createSimplePDF(title, content) {
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
        }
        h1 {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
        }
        h2 {
            color: #374151;
            margin-top: 30px;
        }
        h3 {
            color: #4b5563;
        }
        code {
            background: #f3f4f6;
            padding: 2px 4px;
            border-radius: 3px;
        }
        pre {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 15px;
            overflow-x: auto;
        }
        ul, ol {
            margin: 15px 0;
            padding-left: 25px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${content}
    <div class="footer">
        <p>Document généré automatiquement par le système Profitum</p>
        <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
    </div>
</body>
</html>`;

  return html;
}

// Fonction pour uploader un document dans Supabase
async function uploadDocumentToSupabase(htmlContent, fileName, metadata) {
  try {
    console.log(`📤 Upload de ${fileName}...`);
    
    // Convertir HTML en buffer (simulation PDF)
    const buffer = Buffer.from(htmlContent, 'utf8');
    
    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('admin-documents')
      .upload(`guides/${fileName}`, buffer, {
        contentType: 'text/html',
        upsert: true,
        metadata: {
          title: metadata.title,
          description: metadata.description,
          category: metadata.category,
          priority: metadata.priority,
          type: 'guide',
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
      
      // Créer le contenu HTML
      const htmlContent = createSimplePDF(guide.title, guide.content);
      
      // Générer le nom de fichier
      const fileName = `${guide.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
      
      // Upload vers Supabase
      const uploadedPath = await uploadDocumentToSupabase(htmlContent, fileName, guide);
      
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

    // Test 2: Vérification du bucket admin-documents
    console.log('\n2️⃣ Test bucket admin-documents...');
    const { data: files, error: bucketError } = await supabase.storage
      .from('admin-documents')
      .list('guides');

    if (bucketError) {
      console.log('❌ Erreur bucket:', bucketError.message);
    } else {
      console.log(`✅ ${files.length} fichiers dans le bucket admin-documents`);
    }

    // Test 3: Test d'upload simple
    console.log('\n3️⃣ Test upload simple...');
    const testContent = '<html><body><h1>Test Admin</h1><p>Document de test pour l\'admin.</p></body></html>';
    const testBuffer = Buffer.from(testContent, 'utf8');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('admin-documents')
      .upload(`test/admin-test-${Date.now()}.html`, testBuffer, {
        contentType: 'text/html',
        upsert: true
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
  console.log('🚀 Démarrage des tests admin upload...\n');
  
  await testAdminAPI();
  await createAndUploadTestGuides();
  
  console.log('\n🎉 Tests terminés !');
  console.log('\n📋 Prochaines étapes:');
  console.log('   1. Accéder à /admin/admin-document-upload');
  console.log('   2. Vérifier les guides créés');
  console.log('   3. Tester l\'upload manuel');
  console.log('   4. Configurer le ciblage avancé');
}

runTests().catch(console.error); 
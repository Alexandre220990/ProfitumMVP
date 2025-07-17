// Script complet pour créer le bucket admin-documents et uploader tous les guides PDF
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU5NzI5NywiZXhwIjoyMDU1MTczMjk3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration des guides à convertir et uploader
const guidesToProcess = [
  {
    id: 'ged-admin',
    title: 'Guide GED Admin Améliorée',
    description: 'Guide complet de la Gestion Électronique Documentaire admin avec ciblage avancé',
    category: 'guide',
    priority: 'high',
    file_path: 'GUIDE-GED-ADMIN-AMELIORE.md',
    bucket: 'admin-documents'
  },
  {
    id: 'calendar-advanced',
    title: 'Guide Calendrier Avancé',
    description: 'Utilisation avancée du système de calendrier et gestion des événements',
    category: 'guide',
    priority: 'high',
    file_path: 'GUIDE-CALENDRIER-AVANCE.md',
    bucket: 'admin-documents'
  },
  {
    id: 'workflows-business',
    title: 'Guide Workflows Business',
    description: 'Gestion des workflows métier et processus automatisés',
    category: 'procedure',
    priority: 'high',
    file_path: 'GUIDE-UTILISATION-WORKFLOWS.md',
    bucket: 'admin-documents'
  },
  {
    id: 'ticpe-integration',
    title: 'Guide Intégration TICPE Conditionnelle',
    description: 'Intégration et configuration du système TICPE conditionnel',
    category: 'guide',
    priority: 'medium',
    file_path: 'GUIDE-INTEGRATION-TICPE-CONDITIONNELLE.md',
    bucket: 'admin-documents'
  },
  {
    id: 'compliance-installation',
    title: 'Guide Installation Compliance',
    description: 'Installation et configuration du système de compliance',
    category: 'compliance',
    priority: 'high',
    file_path: 'GUIDE-INSTALLATION-COMPLIANCE.md',
    bucket: 'admin-documents'
  },
  {
    id: 'document-verification',
    title: 'Guide Vérification Documentaire',
    description: 'Processus de vérification et validation documentaire',
    category: 'procedure',
    priority: 'medium',
    file_path: 'GUIDE-VERIFICATION-DOCUMENTAIRE.md',
    bucket: 'admin-documents'
  },
  {
    id: 'notification-fusion',
    title: 'Guide Fusion Notifications',
    description: 'Fusion et unification du système de notifications',
    category: 'guide',
    priority: 'medium',
    file_path: 'GUIDE-FUSION-NOTIFICATIONS.md',
    bucket: 'admin-documents'
  },
  {
    id: 'nomenclature-unification',
    title: 'Guide Unification Nomenclature',
    description: 'Standardisation et unification des nomenclatures',
    category: 'guide',
    priority: 'low',
    file_path: 'GUIDE-UNIFICATION-NOMENCLATURE.md',
    bucket: 'admin-documents'
  },
  {
    id: 'database-complete',
    title: 'Documentation Base de Données Complète',
    description: 'Documentation complète de la structure de base de données',
    category: 'documentation',
    priority: 'high',
    file_path: 'DOCUMENTATION-BASE-DONNEES-COMPLETE.md',
    bucket: 'admin-documents'
  },
  {
    id: 'supabase-tables',
    title: 'Documentation Tables Supabase',
    description: 'Structure détaillée des tables Supabase',
    category: 'documentation',
    priority: 'medium',
    file_path: 'DOCUMENTATION-TABLES-SUPABASE.md',
    bucket: 'admin-documents'
  },
  {
    id: 'migration-session',
    title: 'Documentation Migration Session',
    description: 'Processus de migration des sessions utilisateur',
    category: 'documentation',
    priority: 'medium',
    file_path: 'DOCUMENTATION-MIGRATION-SESSION.md',
    bucket: 'admin-documents'
  },
  {
    id: 'ticpe-simulator',
    title: 'Guide Simulateur TICPE',
    description: 'Utilisation du simulateur TICPE avancé',
    category: 'guide',
    priority: 'high',
    file_path: 'server/docs/GUIDE_SIMULATEUR_TICPE.md',
    bucket: 'admin-documents'
  },
  {
    id: 'ticpe-complete',
    title: 'Documentation TICPE Complète',
    description: 'Documentation complète du système TICPE',
    category: 'documentation',
    priority: 'high',
    file_path: 'server/docs/DOCUMENTATION_TICPE_COMPLETE.md',
    bucket: 'admin-documents'
  },
  {
    id: 'dashboard-usage',
    title: 'Guide Utilisation Dashboard',
    description: 'Guide complet d\'utilisation des dashboards',
    category: 'guide',
    priority: 'medium',
    file_path: 'server/docs/GUIDE_UTILISATION_DASHBOARD.md',
    bucket: 'admin-documents'
  },
  {
    id: 'operational-procedures',
    title: 'Procédures Opérationnelles',
    description: 'Procédures opérationnelles et bonnes pratiques',
    category: 'procedure',
    priority: 'high',
    file_path: 'server/docs/OPERATIONAL_PROCEDURES.md',
    bucket: 'admin-documents'
  }
];

// Fonction pour convertir Markdown en HTML avec mise en forme professionnelle
function convertMarkdownToHTML(markdown) {
  let html = markdown
    // Titres
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Gras et italique
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Code
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    
    // Liens
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    
    // Listes
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    
    // Paragraphes
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, '<p>$1</p>')
    
    // Nettoyage
    .replace(/<p><\/p>/g, '')
    .replace(/<p><h/g, '<h')
    .replace(/<\/h\d><\/p>/g, '</h$1>');

  return html;
}

// Fonction pour créer un PDF avec mise en forme professionnelle
function createPDFContent(title, description, content, category) {
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @page {
            margin: 2cm;
            size: A4;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 15px;
        }
        .meta {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #9ca3af;
            margin-bottom: 20px;
        }
        .category {
            background: #dbeafe;
            color: #1e40af;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 500;
        }
        .content {
            font-size: 14px;
        }
        h1 {
            color: #1e40af;
            font-size: 24px;
            margin-top: 30px;
            margin-bottom: 15px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 5px;
        }
        h2 {
            color: #374151;
            font-size: 20px;
            margin-top: 25px;
            margin-bottom: 12px;
        }
        h3 {
            color: #4b5563;
            font-size: 16px;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        p {
            margin-bottom: 12px;
            text-align: justify;
        }
        code {
            background: #f3f4f6;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
        }
        pre {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 15px;
            overflow-x: auto;
            margin: 15px 0;
        }
        pre code {
            background: none;
            padding: 0;
        }
        ul, ol {
            margin: 15px 0;
            padding-left: 25px;
        }
        li {
            margin-bottom: 5px;
        }
        a {
            color: #2563eb;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
        }
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${title}</div>
        <div class="subtitle">${description}</div>
        <div class="meta">
            <span class="category">${category.toUpperCase()}</span>
            <span>Documentation Profitum - ${new Date().toLocaleDateString('fr-FR')}</span>
        </div>
    </div>
    
    <div class="content">
        ${content}
    </div>
    
    <div class="footer">
        <p>Document généré automatiquement par le système Profitum</p>
        <p>Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR')}</p>
    </div>
</body>
</html>`;

  return html;
}

// Fonction pour créer un PDF simple (simulation avec HTML)
function createSimplePDF(title, description, content, category) {
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
    <p><strong>Description:</strong> ${description}</p>
    <p><strong>Catégorie:</strong> ${category}</p>
    <hr>
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
    
    // Convertir HTML en buffer
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

// Fonction pour créer le bucket admin-documents
async function createAdminBucket() {
  console.log('🔄 Création du bucket admin-documents...\n');

  try {
    // Vérifier les buckets existants
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erreur lors de la récupération des buckets:', bucketsError);
      return false;
    }

    console.log('📁 Buckets existants:');
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    // Vérifier si admin-documents existe déjà
    const adminBucketExists = buckets.some(bucket => bucket.name === 'admin-documents');
    
    if (adminBucketExists) {
      console.log('✅ Bucket admin-documents existe déjà');
      return true;
    } else {
      console.log('⚠️  Bucket admin-documents non trouvé');
      console.log('📋 Instructions pour créer le bucket:');
      console.log('   1. Aller dans Supabase Dashboard > Storage');
      console.log('   2. Cliquer sur "New bucket"');
      console.log('   3. Nom: admin-documents');
      console.log('   4. Public: false');
      console.log('   5. File size limit: 50MB');
      console.log('   6. Allowed MIME types: application/pdf,text/html,text/plain');
      console.log('   7. Cliquer sur "Create bucket"');
      
      // Essayer de créer le bucket via l'API (peut ne pas fonctionner)
      try {
        const { data, error } = await supabase.storage.createBucket('admin-documents', {
          public: false,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ['application/pdf', 'text/html', 'text/plain']
        });
        
        if (error) {
          console.log('❌ Impossible de créer le bucket via API:', error.message);
          console.log('   Création manuelle requise dans le dashboard');
          return false;
        } else {
          console.log('✅ Bucket admin-documents créé avec succès');
          return true;
        }
      } catch (error) {
        console.log('❌ Erreur lors de la création du bucket:', error.message);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des buckets:', error);
    return false;
  }
}

// Fonction principale de traitement
async function processAllGuides() {
  console.log('🚀 Démarrage du traitement complet des guides...\n');

  // 1. Créer le bucket admin-documents
  const bucketCreated = await createAdminBucket();
  
  if (!bucketCreated) {
    console.log('\n⚠️  Veuillez créer le bucket admin-documents manuellement dans Supabase Dashboard');
    console.log('   Puis relancez ce script');
    return;
  }

  // 2. Traiter tous les guides
  const results = [];
  const tempDir = './temp-pdfs';

  // Créer le dossier temporaire
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  for (const guide of guidesToProcess) {
    try {
      console.log(`\n📖 Traitement de ${guide.title}...`);
      
      // Vérifier si le fichier source existe
      if (!fs.existsSync(guide.file_path)) {
        console.log(`⚠️  Fichier source non trouvé: ${guide.file_path}`);
        results.push({
          ...guide,
          status: 'file_not_found'
        });
        continue;
      }

      // Lire le contenu Markdown
      const markdownContent = fs.readFileSync(guide.file_path, 'utf8');
      
      // Convertir en HTML
      const htmlContent = convertMarkdownToHTML(markdownContent);
      
      // Créer le contenu PDF complet
      const fullHTML = createSimplePDF(
        guide.title,
        guide.description,
        htmlContent,
        guide.category
      );

      // Générer le nom de fichier
      const fileName = `${guide.id}-${new Date().toISOString().split('T')[0]}.html`;
      
      // Upload vers Supabase
      const uploadedPath = await uploadDocumentToSupabase(fullHTML, fileName, guide);
      
      if (uploadedPath) {
        results.push({
          ...guide,
          pdf_path: uploadedPath,
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

  // Nettoyer le dossier temporaire
  if (fs.existsSync(tempDir)) {
    fs.rmdirSync(tempDir);
  }

  // Afficher le résumé
  console.log('\n📊 Résumé du traitement:');
  console.log('========================');
  
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status !== 'success').length;
  
  console.log(`✅ Succès: ${successful}`);
  console.log(`❌ Échecs: ${failed}`);
  console.log(`📁 Total: ${results.length}`);

  if (successful > 0) {
    console.log('\n🎉 Guides uploadés avec succès:');
    results.filter(r => r.status === 'success').forEach(guide => {
      console.log(`   📄 ${guide.title} -> ${guide.pdf_path}`);
    });
  }

  if (failed > 0) {
    console.log('\n⚠️  Guides en échec:');
    results.filter(r => r.status !== 'success').forEach(guide => {
      console.log(`   ❌ ${guide.title}: ${guide.status}`);
    });
  }

  // Vérifier le bucket final
  console.log('\n🔍 Vérification finale du bucket...');
  try {
    const { data: files, error } = await supabase.storage
      .from('admin-documents')
      .list('guides');

    if (error) {
      console.log('❌ Erreur lors de la vérification:', error.message);
    } else {
      console.log(`✅ ${files.length} fichiers dans admin-documents/guides/`);
      if (files.length > 0) {
        files.forEach(file => {
          console.log(`   - ${file.name} (${file.metadata?.size || 'N/A'} bytes)`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification finale:', error);
  }

  return results;
}

// Exécuter le traitement
processAllGuides().catch(console.error); 
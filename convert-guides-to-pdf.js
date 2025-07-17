// Script de conversion des guides Markdown en PDF pour l'upload admin
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU5NzI5NywiZXhwIjoyMDU1MTczMjk3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration des guides à convertir
const guidesToConvert = [
  {
    id: 'ged-admin',
    title: 'Guide GED Admin Améliorée',
    description: 'Guide complet de la Gestion Électronique Documentaire admin avec ciblage avancé',
    category: 'guide',
    file_path: 'GUIDE-GED-ADMIN-AMELIORE.md',
    priority: 'high',
    last_updated: '2025-01-15',
    status: 'ready',
    bucket: 'admin-documents'
  },
  {
    id: 'calendar-advanced',
    title: 'Guide Calendrier Avancé',
    description: 'Utilisation avancée du système de calendrier et gestion des événements',
    category: 'guide',
    file_path: 'GUIDE-CALENDRIER-AVANCE.md',
    priority: 'high',
    last_updated: '2025-01-10',
    status: 'ready',
    bucket: 'admin-documents'
  },
  {
    id: 'workflows-business',
    title: 'Guide Workflows Business',
    description: 'Gestion des workflows métier et processus automatisés',
    category: 'procedure',
    file_path: 'GUIDE-UTILISATION-WORKFLOWS.md',
    priority: 'high',
    last_updated: '2025-01-12',
    status: 'ready',
    bucket: 'admin-documents'
  },
  {
    id: 'ticpe-integration',
    title: 'Guide Intégration TICPE Conditionnelle',
    description: 'Intégration et configuration du système TICPE conditionnel',
    category: 'guide',
    file_path: 'GUIDE-INTEGRATION-TICPE-CONDITIONNELLE.md',
    priority: 'medium',
    last_updated: '2025-01-08',
    status: 'ready',
    bucket: 'admin-documents'
  },
  {
    id: 'compliance-installation',
    title: 'Guide Installation Compliance',
    description: 'Installation et configuration du système de compliance',
    category: 'compliance',
    file_path: 'GUIDE-INSTALLATION-COMPLIANCE.md',
    priority: 'high',
    last_updated: '2025-01-05',
    status: 'ready',
    bucket: 'admin-documents'
  },
  {
    id: 'document-verification',
    title: 'Guide Vérification Documentaire',
    description: 'Processus de vérification et validation documentaire',
    category: 'procedure',
    file_path: 'GUIDE-VERIFICATION-DOCUMENTAIRE.md',
    priority: 'medium',
    last_updated: '2025-01-03',
    status: 'ready',
    bucket: 'admin-documents'
  },
  {
    id: 'notification-fusion',
    title: 'Guide Fusion Notifications',
    description: 'Fusion et unification du système de notifications',
    category: 'guide',
    file_path: 'GUIDE-FUSION-NOTIFICATIONS.md',
    priority: 'medium',
    last_updated: '2025-01-02',
    status: 'ready',
    bucket: 'admin-documents'
  },
  {
    id: 'nomenclature-unification',
    title: 'Guide Unification Nomenclature',
    description: 'Standardisation et unification des nomenclatures',
    category: 'guide',
    file_path: 'GUIDE-UNIFICATION-NOMENCLATURE.md',
    priority: 'low',
    last_updated: '2024-12-30',
    status: 'needs_update',
    bucket: 'admin-documents'
  },
  {
    id: 'database-complete',
    title: 'Documentation Base de Données Complète',
    description: 'Documentation complète de la structure de base de données',
    category: 'documentation',
    file_path: 'DOCUMENTATION-BASE-DONNEES-COMPLETE.md',
    priority: 'high',
    last_updated: '2025-01-14',
    status: 'ready',
    bucket: 'admin-documents'
  },
  {
    id: 'supabase-tables',
    title: 'Documentation Tables Supabase',
    description: 'Structure détaillée des tables Supabase',
    category: 'documentation',
    file_path: 'DOCUMENTATION-TABLES-SUPABASE.md',
    priority: 'medium',
    last_updated: '2025-01-10',
    status: 'ready',
    bucket: 'admin-documents'
  },
  {
    id: 'migration-session',
    title: 'Documentation Migration Session',
    description: 'Processus de migration des sessions utilisateur',
    category: 'documentation',
    file_path: 'DOCUMENTATION-MIGRATION-SESSION.md',
    priority: 'medium',
    last_updated: '2025-01-08',
    status: 'ready',
    bucket: 'admin-documents'
  },
  {
    id: 'ticpe-simulator',
    title: 'Guide Simulateur TICPE',
    description: 'Utilisation du simulateur TICPE avancé',
    category: 'guide',
    file_path: 'server/docs/GUIDE_SIMULATEUR_TICPE.md',
    priority: 'high',
    last_updated: '2025-01-12',
    status: 'ready',
    bucket: 'admin-documents'
  },
  {
    id: 'ticpe-complete',
    title: 'Documentation TICPE Complète',
    description: 'Documentation complète du système TICPE',
    category: 'documentation',
    file_path: 'server/docs/DOCUMENTATION_TICPE_COMPLETE.md',
    priority: 'high',
    last_updated: '2025-01-10',
    status: 'ready',
    bucket: 'admin-documents'
  },
  {
    id: 'dashboard-usage',
    title: 'Guide Utilisation Dashboard',
    description: 'Guide complet d\'utilisation des dashboards',
    category: 'guide',
    file_path: 'server/docs/GUIDE_UTILISATION_DASHBOARD.md',
    priority: 'medium',
    last_updated: '2025-01-05',
    status: 'ready',
    bucket: 'admin-documents'
  },
  {
    id: 'operational-procedures',
    title: 'Procédures Opérationnelles',
    description: 'Procédures opérationnelles et bonnes pratiques',
    category: 'procedure',
    file_path: 'server/docs/OPERATIONAL_PROCEDURES.md',
    priority: 'high',
    last_updated: '2025-01-15',
    status: 'ready',
    bucket: 'admin-documents'
  }
];

// Fonction pour convertir Markdown en HTML avec mise en forme
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

// Fonction pour uploader un document dans Supabase
async function uploadDocumentToSupabase(filePath, fileName, metadata) {
  try {
    console.log(`📤 Upload de ${fileName}...`);
    
    // Lire le fichier
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from('admin-documents')
      .upload(`guides/${fileName}`, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
        metadata: {
          title: metadata.title,
          description: metadata.description,
          category: metadata.category,
          priority: metadata.priority,
          last_updated: metadata.last_updated
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

// Fonction principale de conversion
async function convertGuidesToPDF() {
  console.log('🔄 Début de la conversion des guides en PDF...\n');

  const results = [];
  const tempDir = './temp-pdfs';

  // Créer le dossier temporaire
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  for (const guide of guidesToConvert) {
    try {
      console.log(`📖 Traitement de ${guide.title}...`);
      
      // Vérifier si le fichier source existe
      if (!fs.existsSync(guide.file_path)) {
        console.log(`⚠️  Fichier source non trouvé: ${guide.file_path}`);
        continue;
      }

      // Lire le contenu Markdown
      const markdownContent = fs.readFileSync(guide.file_path, 'utf8');
      
      // Convertir en HTML
      const htmlContent = convertMarkdownToHTML(markdownContent);
      
      // Créer le contenu PDF complet
      const fullHTML = createPDFContent(
        guide.title,
        guide.description,
        htmlContent,
        guide.category
      );

      // Créer le fichier HTML temporaire
      const htmlFilePath = path.join(tempDir, `${guide.id}.html`);
      fs.writeFileSync(htmlFilePath, fullHTML);

      // Convertir HTML en PDF (simulation - en production, utiliser puppeteer ou wkhtmltopdf)
      const pdfFileName = `${guide.id}-${new Date().toISOString().split('T')[0]}.pdf`;
      const pdfFilePath = path.join(tempDir, pdfFileName);
      
      // Pour cette démo, on copie le HTML comme PDF (en production, utiliser une vraie conversion)
      fs.copyFileSync(htmlFilePath, pdfFilePath);

      // Upload vers Supabase
      const uploadedPath = await uploadDocumentToSupabase(pdfFilePath, pdfFileName, guide);
      
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

      // Nettoyer les fichiers temporaires
      fs.unlinkSync(htmlFilePath);
      fs.unlinkSync(pdfFilePath);

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
  console.log('\n📊 Résumé de la conversion:');
  console.log('========================');
  
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status !== 'success').length;
  
  console.log(`✅ Succès: ${successful}`);
  console.log(`❌ Échecs: ${failed}`);
  console.log(`📁 Total: ${results.length}`);

  if (successful > 0) {
    console.log('\n🎉 Documents uploadés avec succès:');
    results.filter(r => r.status === 'success').forEach(guide => {
      console.log(`   📄 ${guide.title} -> ${guide.pdf_path}`);
    });
  }

  if (failed > 0) {
    console.log('\n⚠️  Documents en échec:');
    results.filter(r => r.status !== 'success').forEach(guide => {
      console.log(`   ❌ ${guide.title}: ${guide.status}`);
    });
  }

  return results;
}

// Exécuter la conversion
convertGuidesToPDF().catch(console.error); 
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Liste des guides à vérifier et uploader
const guidesToUpload = [
  {
    name: 'GUIDE-DEMARRAGE-SIMULATEUR.md',
    category: 'guides',
    description: 'Guide de démarrage du simulateur TICPE'
  },
  {
    name: 'GUIDE-CALENDRIER-AVANCE.md',
    category: 'guides',
    description: 'Guide d\'utilisation du calendrier avancé'
  },
  {
    name: 'GUIDE-FUSION-NOTIFICATIONS.md',
    category: 'guides',
    description: 'Guide de fusion des notifications'
  },
  {
    name: 'GUIDE-HEBERGEMENT-TEMPORAIRE.md',
    category: 'guides',
    description: 'Guide d\'hébergement temporaire'
  },
  {
    name: 'GUIDE-INSTALLATION-COMPLIANCE.md',
    category: 'guides',
    description: 'Guide d\'installation compliance'
  },
  {
    name: 'GUIDE-INTEGRATION-TICPE-CONDITIONNELLE.md',
    category: 'guides',
    description: 'Guide d\'intégration TICPE conditionnelle'
  },
  {
    name: 'GUIDE-UNIFICATION-NOMENCLATURE.md',
    category: 'guides',
    description: 'Guide d\'unification de la nomenclature'
  },
  {
    name: 'GUIDE-UTILISATION-WORKFLOWS.md',
    category: 'guides',
    description: 'Guide d\'utilisation des workflows'
  },
  {
    name: 'GUIDE-VERIFICATION-DOCUMENTAIRE.md',
    category: 'guides',
    description: 'Guide de vérification documentaire'
  },
  {
    name: 'PLAN-ACTION-INTEGRATION-MAXIMALE-V2.md',
    category: 'workflows',
    description: 'Plan d\'action intégration maximale V2'
  },
  {
    name: 'PLAN-ACTION-INTEGRATION-MAXIMALE.md',
    category: 'workflows',
    description: 'Plan d\'action intégration maximale'
  },
  {
    name: 'PLAN-ACTION-PHASE-2.md',
    category: 'workflows',
    description: 'Plan d\'action phase 2'
  },
  {
    name: 'PLAN-ACTION-WORKFLOW-BUSINESS.md',
    category: 'workflows',
    description: 'Plan d\'action workflow business'
  },
  {
    name: 'PLAN-INTEGRATION-OPTIMISE.md',
    category: 'workflows',
    description: 'Plan d\'intégration optimisé'
  },
  {
    name: 'DOCUMENTATION-BASE-DONNEES-COMPLETE.md',
    category: 'technical',
    description: 'Documentation complète de la base de données'
  },
  {
    name: 'DOCUMENTATION-MIGRATION-SESSION.md',
    category: 'technical',
    description: 'Documentation migration session'
  },
  {
    name: 'DOCUMENTATION-TABLES-SUPABASE.md',
    category: 'technical',
    description: 'Documentation tables Supabase'
  },
  {
    name: 'ETAT-PROJET-FINAL.md',
    category: 'technical',
    description: 'État du projet final'
  },
  {
    name: 'CLIENT_TABLE_REFERENCE.md',
    category: 'technical',
    description: 'Référence table client'
  },
  {
    name: 'CORRECTIONS-REDIRECTION-AUDITS.md',
    category: 'technical',
    description: 'Corrections redirection audits'
  }
];

async function checkExistingFiles() {
  console.log('🔍 Vérification des fichiers existants dans le bucket admin-documents...');
  
  try {
    const { data: files, error } = await supabase.storage
      .from('admin-documents')
      .list('', {
        limit: 1000,
        offset: 0
      });

    if (error) {
      console.error('❌ Erreur lors de la vérification des fichiers:', error);
      return [];
    }

    console.log(`✅ ${files.length} fichiers trouvés dans le bucket`);
    return files.map(file => file.name);
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    return [];
  }
}

async function convertMarkdownToPDF(markdownPath) {
  console.log(`📄 Conversion de ${markdownPath} en PDF...`);
  
  try {
    // Lire le contenu markdown
    const markdownContent = fs.readFileSync(markdownPath, 'utf8');
    
    // Convertir en HTML (simulation pour l'instant)
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${path.basename(markdownPath, '.md')}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e40af; margin-top: 30px; }
        h3 { color: #1e3a8a; }
        code { background-color: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
        pre { background-color: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
        th { background-color: #f9fafb; font-weight: bold; }
        .highlight { background-color: #fef3c7; padding: 2px 4px; border-radius: 4px; }
        .warning { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 10px; margin: 10px 0; }
        .info { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 10px; margin: 10px 0; }
        .success { background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>${path.basename(markdownPath, '.md').replace(/-/g, ' ').toUpperCase()}</h1>
    <div class="content">
        ${markdownContent
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`(.*?)`/g, '<code>$1</code>')
          .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
          .replace(/\n/g, '<br>')
        }
    </div>
    <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #d1d5db; color: #6b7280; font-size: 12px;">
        <p>Document généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}</p>
        <p>FinancialTracker - Système de gestion documentaire</p>
    </div>
</body>
</html>`;
    
    // Créer un fichier HTML temporaire
    const htmlPath = markdownPath.replace('.md', '.html');
    fs.writeFileSync(htmlPath, htmlContent);
    
    console.log(`✅ HTML généré: ${htmlPath}`);
    return htmlPath;
  } catch (error) {
    console.error(`❌ Erreur lors de la conversion de ${markdownPath}:`, error);
    return null;
  }
}

async function uploadToBucket(filePath, fileName, category, description) {
  console.log(`📤 Upload de ${fileName} vers ${category}/...`);
  
  try {
    const fileContent = fs.readFileSync(filePath);
    
    const { data, error } = await supabase.storage
      .from('admin-documents')
      .upload(`${category}/${fileName}`, fileContent, {
        contentType: 'text/html',
        upsert: true,
        metadata: {
          original_name: fileName,
          category: category,
          description: description,
          uploaded_at: new Date().toISOString(),
          file_type: 'guide',
          user_type: 'admin'
        }
      });

    if (error) {
      console.error(`❌ Erreur lors de l'upload de ${fileName}:`, error);
      return false;
    }

    console.log(`✅ ${fileName} uploadé avec succès dans ${category}/`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de l'upload de ${fileName}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Début de la vérification et upload des guides admin...\n');
  
  // Vérifier les fichiers existants
  const existingFiles = await checkExistingFiles();
  
  let uploadedCount = 0;
  let skippedCount = 0;
  
  for (const guide of guidesToUpload) {
    const fileName = guide.name.replace('.md', '.html');
    const filePath = path.join(process.cwd(), guide.name);
    
    // Vérifier si le fichier markdown existe
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Fichier markdown non trouvé: ${guide.name}`);
      continue;
    }
    
    // Vérifier si le fichier existe déjà dans le bucket
    const existingFile = existingFiles.find(file => 
      file === `${guide.category}/${fileName}`
    );
    
    if (existingFile) {
      console.log(`⏭️  Fichier déjà existant: ${guide.category}/${fileName}`);
      skippedCount++;
      continue;
    }
    
    // Convertir markdown en HTML
    const htmlPath = await convertMarkdownToPDF(filePath);
    if (!htmlPath) {
      console.log(`❌ Échec de la conversion: ${guide.name}`);
      continue;
    }
    
    // Upload vers le bucket
    const success = await uploadToBucket(htmlPath, fileName, guide.category, guide.description);
    
    if (success) {
      uploadedCount++;
      // Nettoyer le fichier HTML temporaire
      fs.unlinkSync(htmlPath);
    }
    
    console.log(''); // Ligne vide pour la lisibilité
  }
  
  console.log('📊 Résumé de l\'opération:');
  console.log(`✅ Fichiers uploadés: ${uploadedCount}`);
  console.log(`⏭️  Fichiers ignorés (déjà existants): ${skippedCount}`);
  console.log(`📁 Total traité: ${uploadedCount + skippedCount}`);
  
  // Afficher les statistiques du bucket
  try {
    const { data: stats } = await supabase.storage
      .from('admin-documents')
      .list('', { limit: 1000 });
    
    console.log(`\n📈 Statistiques du bucket admin-documents:`);
    console.log(`📄 Total fichiers: ${stats.length}`);
    
    // Compter par catégorie
    const categories = {};
    stats.forEach(file => {
      const category = file.name.split('/')[0];
      categories[category] = (categories[category] || 0) + 1;
    });
    
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   📁 ${category}: ${count} fichiers`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
  }
}

// Exécuter le script
main().catch(console.error); 
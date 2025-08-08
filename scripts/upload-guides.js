const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase - À remplacer par vos vraies valeurs
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration des guides
const guides = [
  'guide-bienvenue',
  'guide-dashboard', 
  'guide-marketplace',
  'guide-agenda',
  'guide-documents',
  'guide-simulation',
  'guide-profil',
  'guide-notifications',
  'guide-support'
];

// Styles CSS pour les PDF
const pdfStyles = `
<style>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  h1 {
    color: #2563eb;
    border-bottom: 3px solid #2563eb;
    padding-bottom: 10px;
    margin-top: 30px;
  }
  
  h2 {
    color: #1e40af;
    margin-top: 25px;
    border-left: 4px solid #3b82f6;
    padding-left: 15px;
  }
  
  h3 {
    color: #1e3a8a;
    margin-top: 20px;
  }
  
  code {
    background-color: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }
  
  pre {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 15px;
    overflow-x: auto;
  }
  
  blockquote {
    border-left: 4px solid #3b82f6;
    margin: 20px 0;
    padding-left: 20px;
    color: #64748b;
  }
  
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 15px 0;
  }
  
  th, td {
    border: 1px solid #e2e8f0;
    padding: 8px 12px;
    text-align: left;
  }
  
  th {
    background-color: #f8fafc;
    font-weight: 600;
  }
  
  .checklist {
    background-color: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    padding: 15px;
    margin: 15px 0;
  }
  
  .tip {
    background-color: #fef3c7;
    border: 1px solid #fbbf24;
    border-radius: 6px;
    padding: 15px;
    margin: 15px 0;
  }
  
  .warning {
    background-color: #fef2f2;
    border: 1px solid #f87171;
    border-radius: 6px;
    padding: 15px;
    margin: 15px 0;
  }
</style>
`;

async function convertMarkdownToHtml(markdownContent, title) {
  // Conversion simple Markdown vers HTML
  let html = markdownContent
    // Titres
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Gras et italique
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Code inline
    .replace(/`(.*?)`/g, '<code>$1</code>')
    
    // Listes
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    
    // Paragraphes
    .replace(/\n\n/g, '</p><p>')
    
    // Liens
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Ajouter les balises HTML complètes
  html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  ${pdfStyles}
</head>
<body>
<p>${html}</p>
</body>
</html>`;

  return html;
}

async function uploadToSupabase(htmlContent, fileName) {
  try {
    // Pour l'instant, on va uploader le HTML directement
    // Plus tard, on pourra ajouter une vraie conversion PDF
    const buffer = Buffer.from(htmlContent, 'utf8');
    
    const { data, error } = await supabase.storage
      .from('formation')
      .upload(`${fileName}.html`, buffer, {
        contentType: 'text/html',
        upsert: true
      });

    if (error) {
      throw error;
    }

    console.log(`✅ Upload réussi : ${fileName}.html`);
    return data;
  } catch (error) {
    console.error(`❌ Erreur upload ${fileName}:`, error);
    throw error;
  }
}

async function processGuides() {
  console.log('🚀 Début de la conversion et upload des guides...\n');

  for (const guideName of guides) {
    try {
      console.log(`📝 Traitement de ${guideName}...`);
      
      // Chemin du fichier Markdown
      const markdownPath = path.join(__dirname, `../docs/guides/${guideName}.md`);
      
      // Vérifier que le fichier existe
      if (!fs.existsSync(markdownPath)) {
        console.log(`⚠️  Fichier non trouvé : ${markdownPath}`);
        continue;
      }

      // Lire le contenu Markdown
      const markdownContent = fs.readFileSync(markdownPath, 'utf8');
      
      // Convertir en HTML
      const title = `${guideName.replace('guide-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - Guide Utilisateur`;
      const htmlContent = await convertMarkdownToHtml(markdownContent, title);
      
      // Upload dans Supabase
      await uploadToSupabase(htmlContent, guideName);
      
      console.log(`✅ ${guideName} traité avec succès\n`);
      
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de ${guideName}:`, error);
    }
  }

  console.log('🎉 Conversion et upload terminés !');
  console.log('\n📋 Guides disponibles dans le bucket "formation" :');
  guides.forEach(guide => {
    console.log(`   - ${guide}.html`);
  });
  
  console.log('\n💡 Pour convertir en PDF, vous pouvez :');
  console.log('   1. Ouvrir les fichiers HTML dans un navigateur');
  console.log('   2. Utiliser "Imprimer" > "Enregistrer en PDF"');
  console.log('   3. Ou utiliser un service en ligne de conversion HTML vers PDF');
}

// Exécution du script
if (require.main === module) {
  processGuides().catch(console.error);
}

module.exports = { processGuides };

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const markdownpdf = require('markdown-pdf');
const puppeteer = require('puppeteer');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration des guides
const guides = [
  { name: 'guide-bienvenue', title: 'Guide d\'Accueil - Bienvenue sur FinancialTracker' },
  { name: 'guide-dashboard', title: 'Guide Dashboard - Mon Tableau de Bord' },
  { name: 'guide-marketplace', title: 'Guide Marketplace - La Marketplace des Produits' },
  { name: 'guide-agenda', title: 'Guide Agenda - Gérer Mes Rendez-vous' },
  { name: 'guide-documents', title: 'Guide Documents - Mes Documents' },
  { name: 'guide-simulation', title: 'Guide Simulation - Mes Simulations Financières' },
  { name: 'guide-profil', title: 'Guide Profil - Mon Profil et Paramètres' },
  { name: 'guide-notifications', title: 'Guide Notifications - Mes Alertes et Notifications' },
  { name: 'guide-support', title: 'Guide Support - Obtenir de l\'Aide' }
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

async function convertMarkdownToPDF(markdownPath, pdfPath) {
  return new Promise((resolve, reject) => {
    const options = {
      cssPath: null,
      remarkable: {
        html: true,
        breaks: true,
        plugins: [],
        syntax: ['footnote', 'sup', 'sub']
      },
      runningsPath: null,
      paperBorder: '1cm',
      paperFormat: 'A4',
      renderDelay: 1000
    };

    markdownpdf(options)
      .from(markdownPath)
      .to(pdfPath, () => {
        console.log(`✅ PDF créé : ${pdfPath}`);
        resolve();
      });
  });
}

async function uploadToSupabase(pdfPath, fileName) {
  try {
    const fileBuffer = fs.readFileSync(pdfPath);
    
    const { data, error } = await supabase.storage
      .from('formation')
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      throw error;
    }

    console.log(`✅ Upload réussi : ${fileName}`);
    return data;
  } catch (error) {
    console.error(`❌ Erreur upload ${fileName}:`, error);
    throw error;
  }
}

async function processGuides() {
  console.log('🚀 Début de la conversion et upload des guides...\n');

  // Créer le dossier temporaire pour les PDF
  const tempDir = path.join(__dirname, '../temp-pdfs');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  for (const guide of guides) {
    try {
      console.log(`📝 Traitement de ${guide.name}...`);
      
      // Chemins des fichiers
      const markdownPath = path.join(__dirname, `../docs/guides/${guide.name}.md`);
      const pdfPath = path.join(tempDir, `${guide.name}.pdf`);
      
      // Vérifier que le fichier Markdown existe
      if (!fs.existsSync(markdownPath)) {
        console.log(`⚠️  Fichier non trouvé : ${markdownPath}`);
        continue;
      }

      // Lire le contenu Markdown
      let markdownContent = fs.readFileSync(markdownPath, 'utf8');
      
      // Ajouter les styles CSS
      markdownContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${guide.title}</title>
  ${pdfStyles}
</head>
<body>
${markdownContent}
</body>
</html>`;

      // Écrire le contenu avec styles dans un fichier temporaire
      const tempHtmlPath = path.join(tempDir, `${guide.name}.html`);
      fs.writeFileSync(tempHtmlPath, markdownContent);

      // Convertir en PDF avec Puppeteer pour un meilleur rendu
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        margin: {
          top: '2cm',
          right: '2cm',
          bottom: '2cm',
          left: '2cm'
        },
        printBackground: true
      });
      await browser.close();

      // Upload dans Supabase
      await uploadToSupabase(pdfPath, `${guide.name}.pdf`);
      
      // Nettoyer le fichier temporaire HTML
      fs.unlinkSync(tempHtmlPath);
      
      console.log(`✅ ${guide.name} traité avec succès\n`);
      
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de ${guide.name}:`, error);
    }
  }

  // Nettoyer le dossier temporaire
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log('🎉 Conversion et upload terminés !');
  console.log('\n📋 Guides disponibles dans le bucket "formation" :');
  guides.forEach(guide => {
    console.log(`   - ${guide.name}.pdf`);
  });
}

// Exécution du script
if (require.main === module) {
  processGuides().catch(console.error);
}

module.exports = { processGuides };

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const PAGES_DIR = './src/pages';
const COMPONENTS_DIR = './src/components';

// Critères pour identifier les pages obsolètes
const OBSOLETE_CRITERIA = {
  // Pages avec très peu de contenu ou juste des imports
  minLines: 50,
  
  // Pages avec des patterns suspects
  suspiciousPatterns: [
    'console.log',
    'TODO',
    'FIXME',
    '// test',
    '// demo',
    '// old',
    '// deprecated'
  ],
  
  // Pages qui semblent être des doublons
  duplicatePatterns: [
    'test',
    'demo',
    'old',
    'backup',
    'temp',
    'copy'
  ]
};

// Fonction pour analyser un fichier
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const lineCount = lines.length;
    
    // Vérifier les critères d'obsolescence
    const issues = [];
    
    // Vérifier la taille
    if (lineCount < OBSOLETE_CRITERIA.minLines) {
      issues.push(`Petit fichier (${lineCount} lignes)`);
    }
    
    // Vérifier les patterns suspects
    OBSOLETE_CRITERIA.suspiciousPatterns.forEach(pattern => {
      if (content.includes(pattern)) {
        issues.push(`Contient "${pattern}"`);
      }
    });
    
    // Vérifier les patterns de doublons
    const fileName = path.basename(filePath, path.extname(filePath));
    OBSOLETE_CRITERIA.duplicatePatterns.forEach(pattern => {
      if (fileName.toLowerCase().includes(pattern)) {
        issues.push(`Nom suspect: "${pattern}"`);
      }
    });
    
    // Vérifier les imports inutilisés
    const importLines = lines.filter(line => line.trim().startsWith('import'));
    const unusedImports = importLines.filter(line => {
      const importName = line.match(/import\s*{\s*([^}]+)\s*}/);
      if (importName) {
        const imports = importName[1].split(',').map(imp => imp.trim());
        return imports.some(imp => !content.includes(imp));
      }
      return false;
    });
    
    if (unusedImports.length > 0) {
      issues.push(`${unusedImports.length} imports potentiellement inutilisés`);
    }
    
    return {
      filePath,
      lineCount,
      issues,
      isObsolete: issues.length > 0
    };
  } catch (error) {
    return {
      filePath,
      error: error.message,
      isObsolete: false
    };
  }
}

// Fonction pour parcourir récursivement les fichiers
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  const results = [];

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results.push(...walkDir(filePath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(analyzeFile(filePath));
    }
  });

  return results;
}

// Fonction pour générer le rapport
function generateReport(analysis) {
  const obsoleteFiles = analysis.filter(file => file.isObsolete);
  const normalFiles = analysis.filter(file => !file.isObsolete);
  
  console.log('# Rapport d\'Analyse des Pages Obsolètes\n');
  console.log(`## Résumé\n`);
  console.log(`- Total de fichiers analysés: ${analysis.length}`);
  console.log(`- Fichiers potentiellement obsolètes: ${obsoleteFiles.length}`);
  console.log(`- Fichiers normaux: ${normalFiles.length}\n`);
  
  if (obsoleteFiles.length > 0) {
    console.log('## Fichiers Potentiellement Obsolètes\n');
    
    obsoleteFiles.forEach(file => {
      console.log(`### ${file.filePath}\n`);
      console.log(`- Lignes: ${file.lineCount}`);
      console.log(`- Problèmes détectés:`);
      file.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
      console.log('');
    });
  }
  
  console.log('## Recommandations\n');
  console.log('1. **Pages à supprimer immédiatement:**');
  obsoleteFiles
    .filter(file => file.issues.some(issue => issue.includes('test') || issue.includes('demo')))
    .forEach(file => {
      console.log(`   - ${file.filePath}`);
    });
  
  console.log('\n2. **Pages à refactoriser:**');
  obsoleteFiles
    .filter(file => file.issues.some(issue => issue.includes('imports')))
    .forEach(file => {
      console.log(`   - ${file.filePath}`);
    });
  
  console.log('\n3. **Pages à consolider:**');
  obsoleteFiles
    .filter(file => file.issues.some(issue => issue.includes('Petit fichier')))
    .forEach(file => {
      console.log(`   - ${file.filePath}`);
    });
}

// Fonction principale
function main() {
  console.log('🔍 Analyse des pages obsolètes...\n');

  if (!fs.existsSync(PAGES_DIR)) {
    console.error(`❌ Le répertoire ${PAGES_DIR} n'existe pas`);
    process.exit(1);
  }

  // Analyser les pages
  const pagesAnalysis = walkDir(PAGES_DIR);
  
  // Analyser les composants
  const componentsAnalysis = walkDir(COMPONENTS_DIR);
  
  // Combiner les analyses
  const allAnalysis = [...pagesAnalysis, ...componentsAnalysis];
  
  // Générer le rapport
  generateReport(allAnalysis);
  
  // Sauvegarder le rapport
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: allAnalysis.length,
      obsolete: allAnalysis.filter(f => f.isObsolete).length,
      normal: allAnalysis.filter(f => !f.isObsolete).length
    },
    obsoleteFiles: allAnalysis.filter(f => f.isObsolete),
    normalFiles: allAnalysis.filter(f => !f.isObsolete)
  };
  
  fs.writeFileSync('obsolete-pages-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Rapport sauvegardé dans obsolete-pages-report.json');
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { analyzeFile, walkDir, generateReport }; 
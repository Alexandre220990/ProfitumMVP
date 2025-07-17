#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = './src';
const EXTENSIONS = ['.tsx', '.ts'];

// Patterns de correction pour les erreurs de syntaxe courantes
const SYNTAX_FIXES = [
  // Corriger les imports manquants
  {
    pattern: /import\s*{\s*([^}]*)\s*}\s*from\s*['"]([^'"]*)['"]/g,
    replacement: (match, imports, module) => {
      // Nettoyer les imports avec des virgules en trop
      const cleanImports = imports
        .split(',')
        .map(imp => imp.trim())
        .filter(imp => imp && imp !== ',')
        .join(', ');
      
      if (cleanImports) {
        return `import { ${cleanImports} } from "${module}"`;
      } else {
        return `// import removed from "${module}"`;
      }
    }
  },
  
  // Corriger les objets avec des virgules manquantes
  {
    pattern: /(\w+):\s*([^,}]+)(?=\s*[^,}])/g,
    replacement: '$1: $2,'
  },
  
  // Corriger les déclarations de variables avec des virgules manquantes
  {
    pattern: /const\s*\[([^,]+)\s+([^\]]+)\]\s*=\s*useState/g,
    replacement: 'const [$1, $2] = useState'
  },
  
  // Corriger les objets dans les arrays
  {
    pattern: /{\s*icon:\s*([^,}]+)\s*value:\s*([^,}]+)\s*label:\s*([^,}]+)\s*}/g,
    replacement: '{ icon: $1, value: $2, label: $3 }'
  },
  
  // Corriger les objets avec des propriétés manquantes
  {
    pattern: /title:\s*"([^"]+)"\s*description:\s*"([^"]+)"/g,
    replacement: 'title: "$1", description: "$2"'
  },
  
  // Corriger les exports manquants
  {
    pattern: /export\s*{\s*([^}]+)\s*}/g,
    replacement: (match, exports) => {
      const cleanExports = exports
        .split(',')
        .map(exp => exp.trim())
        .filter(exp => exp && exp !== ',')
        .join(', ');
      
      return `export { ${cleanExports} }`;
    }
  }
];

// Fonction pour corriger un fichier
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fixed = false;

    // Appliquer les corrections de syntaxe
    SYNTAX_FIXES.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        fixed = true;
      }
    });

    // Nettoyer les lignes vides multiples
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (fixed || content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Corrigé: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors de la correction de ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour parcourir récursivement les fichiers
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let fixedFiles = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixedFiles += walkDir(filePath);
    } else if (EXTENSIONS.includes(path.extname(file))) {
      if (fixFile(filePath)) {
        fixedFiles++;
      }
    }
  });

  return fixedFiles;
}

// Fonction principale
function main() {
  console.log('🔧 Correction des erreurs de syntaxe...\n');

  if (!fs.existsSync(SRC_DIR)) {
    console.error(`❌ Le répertoire ${SRC_DIR} n'existe pas`);
    process.exit(1);
  }

  const fixedFiles = walkDir(SRC_DIR);
  
  console.log(`\n🎉 Correction terminée ! ${fixedFiles} fichiers corrigés.`);
  
  // Vérifier s'il y a encore des erreurs TypeScript
  console.log('\n🔍 Vérification des erreurs TypeScript restantes...');
  try {
    const { execSync } = require('child_process');
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    console.log('✅ Aucune erreur TypeScript restante !');
  } catch (error) {
    console.log('⚠️ Il reste encore des erreurs TypeScript à corriger manuellement.');
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { fixFile, walkDir }; 
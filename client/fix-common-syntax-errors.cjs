#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = './src';
const EXTENSIONS = ['.tsx', '.ts'];

// Corrections spécifiques pour les erreurs courantes
const COMMON_FIXES = [
  // Corriger les virgules en trop dans les interfaces
  {
    pattern: /(\w+):\s*([^,}]+);,/g,
    replacement: '$1: $2,'
  },
  
  // Corriger les virgules en trop dans les objets
  {
    pattern: /(\w+):\s*([^,}]+),/g,
    replacement: '$1: $2,'
  },
  
  // Corriger les virgules en trop dans les arrays
  {
    pattern: /,\s*,/g,
    replacement: ','
  },
  
  // Corriger les virgules en trop dans les imports
  {
    pattern: /import\s*{\s*([^}]*)\s*}\s*from\s*['"]([^'"]*)['"]/g,
    replacement: (match, imports, module) => {
      const cleanImports = imports
        .split(',')
        .map(imp => imp.trim())
        .filter(imp => imp && imp !== ',')
        .join(', ');
      
      return `import { ${cleanImports} } from "${module}"`;
    }
  },
  
  // Corriger les virgules en trop dans les exports
  {
    pattern: /export\s*{\s*([^}]*)\s*}/g,
    replacement: (match, exports) => {
      const cleanExports = exports
        .split(',')
        .map(exp => exp.trim())
        .filter(exp => exp && exp !== ',')
        .join(', ');
      
      return `export { ${cleanExports} }`;
    }
  },
  
  // Corriger les virgules en trop dans les types
  {
    pattern: /Record<([^,]+),([^>]+)>/g,
    replacement: (match, key, value) => {
      const cleanKey = key.replace(/,/g, '');
      const cleanValue = value.replace(/,/g, '');
      return `Record<${cleanKey}, ${cleanValue}>`;
    }
  },
  
  // Corriger les virgules en trop dans les paramètres de fonction
  {
    pattern: /(\w+):\s*([^,)]+),/g,
    replacement: '$1: $2,'
  },
  
  // Corriger les virgules en trop dans les objets littéraux
  {
    pattern: /{\s*([^}]*)\s*}/g,
    replacement: (match, content) => {
      const cleanContent = content
        .split(',')
        .map(item => item.trim())
        .filter(item => item && item !== ',')
        .join(', ');
      
      return `{ ${cleanContent} }`;
    }
  },
  
  // Corriger les virgules en trop dans les arrays
  {
    pattern: /\[\s*,\s*\]/g,
    replacement: '[]'
  },
  
  // Corriger les virgules en trop dans les objets
  {
    pattern: /{\s*,\s*}/g,
    replacement: '{}'
  },
  
  // Corriger les virgules en trop dans les paramètres de fonction
  {
    pattern: /\(\s*,\s*\)/g,
    replacement: '()'
  },
  
  // Corriger les virgules en trop dans les appels de fonction
  {
    pattern: /\(\s*([^)]*)\s*,\s*\)/g,
    replacement: '($1)'
  },
  
  // Corriger les virgules en trop dans les objets avec des propriétés
  {
    pattern: /(\w+):\s*([^,}]+),\s*,/g,
    replacement: '$1: $2,'
  },
  
  // Corriger les virgules en trop dans les arrays avec des éléments
  {
    pattern: /\[\s*([^\]]*)\s*,\s*\]/g,
    replacement: '[$1]'
  }
];

// Fonction pour corriger un fichier
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fixed = false;

    // Appliquer les corrections spécifiques
    COMMON_FIXES.forEach(fix => {
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
  console.log('🔧 Correction des erreurs de syntaxe courantes...\n');

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
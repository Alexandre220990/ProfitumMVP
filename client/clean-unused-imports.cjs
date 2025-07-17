#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SRC_DIR = './src';
const EXTENSIONS = ['.tsx', '.ts'];

// Patterns d'imports inutilisés courants
const UNUSED_IMPORTS = {
  // React imports
  'import React,': 'import',
  'import React from': '// React import removed',
  
  // Lucide icons inutilisés
  'FileText,': '',
  'Users,': '',
  'ArrowRight,': '',
  'Zap,': '',
  'CheckCircle,': '',
  'Star,': '',
  'Target,': '',
  'UserCircle,': '',
  'Calendar,': '',
  'Download,': '',
  'ExternalLink,': '',
  'ChevronDown,': '',
  'ChevronUp,': '',
  'XCircle,': '',
  
  // UI components inutilisés
  'Link,': '',
  'Button,': '',
  'Card,': '',
  'Badge,': '',
  'Textarea,': '',
  'Input,': '',
  'Label,': '',
  
  // Hooks inutilisés
  'useLocation,': '',
  'useEffect,': '',
  'useState,': '',
  
  // Utils inutilisés
  'cn,': '',
  'get,': '',
  'ApiResponse,': '',
};

// Fonction pour nettoyer un fichier
function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let cleaned = false;

    // Nettoyer les imports inutilisés
    Object.entries(UNUSED_IMPORTS).forEach(([pattern, replacement]) => {
      if (content.includes(pattern)) {
        content = content.replace(new RegExp(pattern, 'g'), replacement);
        cleaned = true;
      }
    });

    // Nettoyer les lignes d'import vides
    content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]*['"];?\s*\n/g, '');
    content = content.replace(/import\s*{\s*,\s*}\s*from\s*['"][^'"]*['"];?\s*\n/g, '');
    
    // Nettoyer les imports avec seulement des virgules
    content = content.replace(/import\s*{\s*,+\s*}\s*from\s*['"][^'"]*['"];?\s*\n/g, '');

    // Supprimer les lignes vides multiples
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (cleaned || content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Nettoyé: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors du nettoyage de ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour parcourir récursivement les fichiers
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let cleanedFiles = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      cleanedFiles += walkDir(filePath);
    } else if (EXTENSIONS.includes(path.extname(file))) {
      if (cleanFile(filePath)) {
        cleanedFiles++;
      }
    }
  });

  return cleanedFiles;
}

// Fonction principale
function main() {
  console.log('🧹 Nettoyage des imports inutilisés...\n');

  if (!fs.existsSync(SRC_DIR)) {
    console.error(`❌ Le répertoire ${SRC_DIR} n'existe pas`);
    process.exit(1);
  }

  const cleanedFiles = walkDir(SRC_DIR);
  
  console.log(`\n🎉 Nettoyage terminé ! ${cleanedFiles} fichiers nettoyés.`);
  
  // Vérifier s'il y a encore des erreurs TypeScript
  console.log('\n🔍 Vérification des erreurs TypeScript restantes...');
  try {
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

module.exports = { cleanFile, walkDir }; 
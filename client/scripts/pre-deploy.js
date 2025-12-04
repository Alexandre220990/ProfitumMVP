#!/usr/bin/env node

/**
 * Script de pré-déploiement
 * 
 * Ce script :
 * 1. Lit la version actuelle du Service Worker
 * 2. Incrémente automatiquement la version
 * 3. Met à jour le fichier sw.js
 * 4. Affiche les informations de déploiement
 */

const fs = require('fs');
const path = require('path');

const SW_PATH = path.join(__dirname, '../public/sw.js');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function incrementVersion(version) {
  // Version format: v1.0.0
  const match = version.match(/v(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    throw new Error(`Format de version invalide: ${version}`);
  }

  const [, major, minor, patch] = match;
  const newPatch = parseInt(patch) + 1;
  
  return `v${major}.${minor}.${newPatch}`;
}

function updateServiceWorker() {
  try {
    // Lire le fichier sw.js
    const content = fs.readFileSync(SW_PATH, 'utf8');
    
    // Extraire la version actuelle
    const versionMatch = content.match(/const CACHE_VERSION = '([^']+)';/);
    if (!versionMatch) {
      throw new Error('Impossible de trouver CACHE_VERSION dans sw.js');
    }
    
    const currentVersion = versionMatch[1];
    const newVersion = incrementVersion(currentVersion);
    
    // Remplacer la version
    const newContent = content.replace(
      /const CACHE_VERSION = '[^']+';/,
      `const CACHE_VERSION = '${newVersion}';`
    );
    
    // Écrire le fichier modifié
    fs.writeFileSync(SW_PATH, newContent, 'utf8');
    
    log('\n╔════════════════════════════════════════════════╗', 'bright');
    log('║       🚀 PRÉ-DÉPLOIEMENT PROFITUM 🚀         ║', 'bright');
    log('╚════════════════════════════════════════════════╝', 'bright');
    log('');
    log(`✅ Service Worker mis à jour`, 'green');
    log(`   Ancienne version : ${currentVersion}`, 'yellow');
    log(`   Nouvelle version : ${newVersion}`, 'green');
    log('');
    log('📋 Prochaines étapes :', 'blue');
    log('   1. Vérifier les changements avec git diff', 'reset');
    log('   2. Commiter les changements', 'reset');
    log('   3. Lancer le build : npm run build', 'reset');
    log('   4. Déployer vers production', 'reset');
    log('');
    log('💡 Astuce : Utilisez "npm run deploy" pour automatiser', 'yellow');
    log('');
    
    return { currentVersion, newVersion };
  } catch (error) {
    log(`\n❌ Erreur : ${error.message}`, 'red');
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  updateServiceWorker();
}

module.exports = { updateServiceWorker, incrementVersion };


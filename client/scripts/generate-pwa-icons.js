/**
 * Script pour générer les icônes PWA à partir du logo Profitum
 * 
 * Usage: node scripts/generate-pwa-icons.js
 * 
 * Nécessite: npm install canvas (ou sharp)
 */

const fs = require('fs');
const path = require('path');

// Tailles d'icônes requises pour PWA
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

const outputDir = path.join(__dirname, '../public/images');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('📦 Génération des icônes PWA...');
console.log('⚠️  Ce script nécessite une bibliothèque de manipulation d\'images.');
console.log('💡 Pour générer les vraies icônes, utilisez un outil en ligne comme:');
console.log('   - https://realfavicongenerator.net/');
console.log('   - https://www.pwabuilder.com/imageGenerator');
console.log('   - Ou un outil de design (Figma, Photoshop, etc.)');
console.log('');
console.log('📋 Tailles requises:');
iconSizes.forEach(({ size, name }) => {
  console.log(`   - ${name} (${size}x${size}px)`);
});

console.log('');
console.log('✅ Placez vos icônes générées dans: client/public/images/');
console.log('✅ Assurez-vous qu\'elles sont nommées exactement comme indiqué ci-dessus');


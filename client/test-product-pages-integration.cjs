const fs = require('fs');
const path = require('path');

// Liste des pages produits à vérifier
const productPages = [
  'comptable-product.tsx',
  'social-product.tsx',
  'foncier-product.tsx',
  'juridique-product.tsx',
  'energie-product.tsx',
  'cir-product.tsx',
  'cee-product.tsx',
  'audit_energetique.tsx',
  'urssaf-product.tsx',
  'ticpe-product.tsx',
  'dfs-product.tsx'
];

const pagesDir = path.join(__dirname, 'src', 'pages', 'produits');

console.log('🔍 Vérification de l\'intégration du workflow de progression sur les pages produits...\n');

let successCount = 0;
let errorCount = 0;
const results = [];

productPages.forEach(pageFile => {
  const filePath = path.join(pagesDir, pageFile);
  
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Vérifications principales
      const hasProductProcessWorkflow = content.includes('ProductProcessWorkflow');
      
      // Vérifications pour les pages avec configuration statique
      const hasProductConfig = content.includes('productConfig');
      const hasSteps = content.includes('steps:');
      const hasBenefits = content.includes('benefits:');
      const hasServices = content.includes('services:');
      const hasCta = content.includes('cta:');
      
      // Vérifications pour les pages avec logique dynamique
      const hasUseAuth = content.includes('useAuth');
      const hasUseEffect = content.includes('useEffect');
      const hasClientProduit = content.includes('clientProduit');
      const hasLoadClientProduit = content.includes('loadClientProduit');
      
      // Déterminer le type de page
      const isStaticPage = hasProductConfig && hasSteps && hasBenefits && hasServices && hasCta;
      const isDynamicPage = hasUseAuth && hasUseEffect && hasClientProduit && hasLoadClientProduit;
      
      const isIntegrated = hasProductProcessWorkflow && (isStaticPage || isDynamicPage);
      
      if (isIntegrated) {
        const pageType = isStaticPage ? 'Statique' : 'Dynamique';
        console.log(`✅ ${pageFile} - Intégration réussie (${pageType})`);
        successCount++;
        results.push({ file: pageFile, status: 'success', type: pageType });
      } else {
        console.log(`❌ ${pageFile} - Intégration incomplète`);
        errorCount++;
        results.push({ file: pageFile, status: 'error', details: 'Éléments manquants' });
      }
    } else {
      console.log(`⚠️  ${pageFile} - Fichier non trouvé`);
      errorCount++;
      results.push({ file: pageFile, status: 'missing' });
    }
  } catch (error) {
    console.log(`❌ ${pageFile} - Erreur de lecture: ${error.message}`);
    errorCount++;
    results.push({ file: pageFile, status: 'error', details: error.message });
  }
});

console.log('\n📊 Résumé de l\'intégration:');
console.log(`✅ Pages intégrées avec succès: ${successCount}`);
console.log(`❌ Pages avec problèmes: ${errorCount}`);
console.log(`📈 Taux de réussite: ${((successCount / productPages.length) * 100).toFixed(1)}%`);

// Vérification du composant ProductProcessWorkflow
const componentPath = path.join(__dirname, 'src', 'components', 'ProductProcessWorkflow.tsx');
if (fs.existsSync(componentPath)) {
  console.log('\n✅ Composant ProductProcessWorkflow.tsx trouvé');
} else {
  console.log('\n❌ Composant ProductProcessWorkflow.tsx manquant');
  errorCount++;
}

// Détails des erreurs
if (errorCount > 0) {
  console.log('\n🔍 Détails des problèmes:');
  results.filter(r => r.status !== 'success').forEach(result => {
    console.log(`- ${result.file}: ${result.status}${result.details ? ` - ${result.details}` : ''}`);
  });
}

// Détails des succès
console.log('\n✅ Pages intégrées avec succès:');
results.filter(r => r.status === 'success').forEach(result => {
  console.log(`- ${result.file} (${result.type})`);
});

console.log('\n🎯 Recommandations:');
if (successCount === productPages.length) {
  console.log('✅ Toutes les pages produits ont été intégrées avec succès !');
  console.log('✅ Le workflow de progression est maintenant disponible sur toutes les pages produits.');
  console.log('✅ Les pages utilisent soit une configuration statique soit une logique dynamique selon leurs besoins.');
} else {
  console.log('⚠️  Certaines pages nécessitent encore une intégration complète.');
  console.log('💡 Vérifiez que toutes les pages utilisent le composant ProductProcessWorkflow.');
}

console.log('\n🚀 Test terminé !'); 
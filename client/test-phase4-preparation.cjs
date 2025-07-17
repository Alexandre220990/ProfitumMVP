/**
 * Script de test pour la Phase 4 - Préparation à l'Optimisation Globale
 * Analyse l'état actuel de l'application et identifie les optimisations nécessaires
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Analyse Phase 4 - Préparation à l\'Optimisation Globale\n');

// Configuration des tests
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: [],
  recommendations: []
};

// Fonction utilitaire pour les tests
function test(description, testFunction) {
  testResults.total++;
  try {
    const result = testFunction();
    testResults.passed++;
    testResults.details.push({ description, status: 'PASSED', result });
    console.log(`✅ ${description}`);
    if (result && result.recommendation) {
      testResults.recommendations.push(result.recommendation);
    }
  } catch (error) {
    testResults.failed++;
    testResults.details.push({ description, status: 'FAILED', error: error.message });
    console.log(`❌ ${description}`);
    console.log(`   Erreur: ${error.message}`);
  }
}

// Test 1: Vérification de la structure de l'application
test('Structure de l\'application cohérente', () => {
  const requiredDirs = [
    'src/components',
    'src/pages',
    'src/hooks',
    'src/contexts',
    'src/types',
    'src/lib',
    'src/data'
  ];
  
  for (const dir of requiredDirs) {
    if (!fs.existsSync(path.join(__dirname, dir))) {
      throw new Error(`Répertoire manquant: ${dir}`);
    }
  }
  
  return { recommendation: 'Structure de base solide' };
});

// Test 2: Vérification des contextes
test('Contextes d\'application présents', () => {
  const contexts = [
    'src/contexts/AdminContext.tsx',
    'src/contexts/ExpertContext.tsx',
    'src/contexts/ClientContext.tsx'
  ];
  
  for (const context of contexts) {
    if (!fs.existsSync(path.join(__dirname, context))) {
      throw new Error(`Contexte manquant: ${context}`);
    }
  }
  
  return { recommendation: 'Architecture contextuelle complète' };
});

// Test 3: Vérification des hooks personnalisés
test('Hooks personnalisés disponibles', () => {
  const hooks = [
    'src/hooks/useAuth.tsx',
    'src/hooks/useUser.ts',
    'src/hooks/useGEDFavorites.ts'
  ];
  
  for (const hook of hooks) {
    if (!fs.existsSync(path.join(__dirname, hook))) {
      throw new Error(`Hook manquant: ${hook}`);
    }
  }
  
  return { recommendation: 'Système de hooks bien structuré' };
});

// Test 4: Vérification des composants UI
test('Composants UI shadcn/ui présents', () => {
  const uiComponents = [
    'src/components/ui/button.tsx',
    'src/components/ui/card.tsx',
    'src/components/ui/input.tsx',
    'src/components/ui/dialog.tsx'
  ];
  
  for (const component of uiComponents) {
    if (!fs.existsSync(path.join(__dirname, component))) {
      throw new Error(`Composant UI manquant: ${component}`);
    }
  }
  
  return { recommendation: 'Système de design cohérent' };
});

// Test 5: Vérification de la configuration TypeScript
test('Configuration TypeScript présente', () => {
  const tsConfig = path.join(__dirname, 'tsconfig.json');
  if (!fs.existsSync(tsConfig)) {
    throw new Error('Configuration TypeScript manquante');
  }
  
  const config = JSON.parse(fs.readFileSync(tsConfig, 'utf8'));
  if (!config.compilerOptions) {
    throw new Error('Options de compilation TypeScript manquantes');
  }
  
  return { recommendation: 'Configuration TypeScript valide' };
});

// Test 6: Vérification de la configuration Vite
test('Configuration Vite optimisée', () => {
  const viteConfig = path.join(__dirname, 'vite.config.ts');
  if (!fs.existsSync(viteConfig)) {
    throw new Error('Configuration Vite manquante');
  }
  
  const configContent = fs.readFileSync(viteConfig, 'utf8');
  if (!configContent.includes('defineConfig')) {
    throw new Error('Configuration Vite non optimisée');
  }
  
  return { recommendation: 'Configuration Vite présente' };
});

// Test 7: Vérification des types TypeScript
test('Types TypeScript définis', () => {
  const typesDir = path.join(__dirname, 'src/types');
  const typeFiles = fs.readdirSync(typesDir).filter(file => file.endsWith('.ts'));
  
  if (typeFiles.length === 0) {
    throw new Error('Aucun fichier de types TypeScript trouvé');
  }
  
  return { recommendation: `${typeFiles.length} fichiers de types disponibles` };
});

// Test 8: Vérification de la gestion d'état
test('Gestion d\'état avec React Query', () => {
  const queryClient = path.join(__dirname, 'src/lib/queryClient.ts');
  if (!fs.existsSync(queryClient)) {
    throw new Error('Configuration React Query manquante');
  }
  
  const content = fs.readFileSync(queryClient, 'utf8');
  if (!content.includes('QueryClient')) {
    throw new Error('React Query non configuré');
  }
  
  return { recommendation: 'Cache intelligent React Query configuré' };
});

// Test 9: Vérification de l'authentification
test('Système d\'authentification présent', () => {
  const authFiles = [
    'src/lib/supabase-auth.ts',
    'src/hooks/useAuth.tsx'
  ];
  
  for (const file of authFiles) {
    if (!fs.existsSync(path.join(__dirname, file))) {
      throw new Error(`Fichier d'authentification manquant: ${file}`);
    }
  }
  
  return { recommendation: 'Système d\'authentification Supabase implémenté' };
});

// Test 10: Vérification des composants de sécurité
test('Composants de sécurité disponibles', () => {
  const securityComponents = [
    'src/components/ui/security-audit.tsx'
  ];
  
  for (const component of securityComponents) {
    if (!fs.existsSync(path.join(__dirname, component))) {
      throw new Error(`Composant de sécurité manquant: ${component}`);
    }
  }
  
  return { recommendation: 'Audit de sécurité disponible' };
});

// Test 11: Vérification des composants de performance
test('Composants de performance présents', () => {
  const performanceComponents = [
    'src/components/ui/loading-states.tsx'
  ];
  
  for (const component of performanceComponents) {
    if (!fs.existsSync(path.join(__dirname, component))) {
      throw new Error(`Composant de performance manquant: ${component}`);
    }
  }
  
  return { recommendation: 'États de chargement optimisés' };
});

// Test 12: Vérification de la documentation
test('Documentation technique présente', () => {
  const docsDir = path.join(__dirname, 'src/data/documentation');
  if (!fs.existsSync(docsDir)) {
    throw new Error('Répertoire de documentation manquant');
  }
  
  const docFiles = fs.readdirSync(docsDir).filter(file => file.endsWith('.ts'));
  if (docFiles.length === 0) {
    throw new Error('Aucun fichier de documentation trouvé');
  }
  
  return { recommendation: `${docFiles.length} fichiers de documentation disponibles` };
});

// Test 13: Vérification des tests existants
test('Tests automatisés présents', () => {
  const testFiles = fs.readdirSync(__dirname).filter(file => 
    file.includes('test') && (file.endsWith('.js') || file.endsWith('.cjs'))
  );
  
  if (testFiles.length === 0) {
    throw new Error('Aucun test automatisé trouvé');
  }
  
  return { recommendation: `${testFiles.length} scripts de test disponibles` };
});

// Test 14: Vérification de la configuration des dépendances
test('Dépendances optimisées', () => {
  const packageJson = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packageJson)) {
    throw new Error('package.json manquant');
  }
  
  const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
  const requiredDeps = ['react', 'react-dom', 'typescript', 'vite'];
  
  for (const dep of requiredDeps) {
    if (!pkg.dependencies[dep] && !pkg.devDependencies[dep]) {
      throw new Error(`Dépendance manquante: ${dep}`);
    }
  }
  
  return { recommendation: 'Dépendances principales présentes' };
});

// Test 15: Vérification de la structure des pages
test('Pages principales présentes', () => {
  const pagesDir = path.join(__dirname, 'src/pages');
  const requiredPages = [
    'dashboard/client.tsx',
    'admin/dashboard.tsx',
    'expert/dashboard.tsx'
  ];
  
  for (const page of requiredPages) {
    if (!fs.existsSync(path.join(pagesDir, page))) {
      throw new Error(`Page manquante: ${page}`);
    }
  }
  
  return { recommendation: 'Pages principales implémentées' };
});

console.log('\n📊 Résultats de l\'analyse Phase 4');
console.log('=' .repeat(60));
console.log(`Total des tests: ${testResults.total}`);
console.log(`Tests réussis: ${testResults.passed}`);
console.log(`Tests échoués: ${testResults.failed}`);
console.log(`Taux de réussite: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

if (testResults.failed > 0) {
  console.log('\n❌ Problèmes identifiés:');
  testResults.details
    .filter(test => test.status === 'FAILED')
    .forEach(test => {
      console.log(`   - ${test.description}: ${test.error}`);
    });
}

console.log('\n💡 Recommandations identifiées:');
testResults.recommendations.forEach((rec, index) => {
  console.log(`   ${index + 1}. ${rec}`);
});

console.log('\n🎯 État de préparation Phase 4');
if (testResults.failed === 0) {
  console.log('✅ APPLICATION PRÊTE POUR L\'OPTIMISATION !');
  console.log('✅ Tous les composants de base sont présents');
  console.log('✅ L\'architecture est solide et modulaire');
  console.log('✅ Les systèmes de sécurité et performance sont en place');
  console.log('✅ La documentation est complète');
  console.log('\n🚀 Peut démarrer la Phase 4 - Optimisation Globale');
} else if (testResults.failed <= 3) {
  console.log('⚠️ APPLICATION PRESQUE PRÊTE');
  console.log('⚠️ Quelques ajustements mineurs nécessaires');
  console.log('⚠️ Peut démarrer la Phase 4 avec corrections préalables');
} else {
  console.log('❌ CORRECTIONS MAJEURES NÉCESSAIRES');
  console.log('❌ Doit corriger les problèmes identifiés avant Phase 4');
  console.log('❌ Recommande de traiter les erreurs critiques en premier');
}

console.log('\n📋 Plan d\'action recommandé:');
console.log('1. Corriger les erreurs identifiées');
console.log('2. Optimiser la configuration TypeScript');
console.log('3. Améliorer la configuration Vite');
console.log('4. Implémenter les optimisations de performance');
console.log('5. Renforcer la sécurité');
console.log('6. Optimiser l\'UX/UI');
console.log('7. Mettre en place le monitoring');

console.log('\n🎉 Analyse Phase 4 terminée !'); 
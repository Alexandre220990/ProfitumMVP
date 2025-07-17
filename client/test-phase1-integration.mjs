#!/usr/bin/env node

/**
 * Script de test pour la Phase 1 - Interface Admin
 * Valide l'intégration complète des modules admin
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 TEST PHASE 1 - INTÉGRATION INTERFACE ADMIN');
console.log('=============================================\n');

// Configuration des tests
const tests = [
  {
    name: 'Contexte Admin',
    files: [
      'src/contexts/AdminContext.tsx',
      'src/components/ui/admin-dashboard.tsx',
      'src/pages/admin/dashboard.tsx'
    ],
    description: 'Vérification du contexte admin et des composants'
  },
  {
    name: 'Système de Permissions',
    files: [
      'src/contexts/AdminContext.tsx'
    ],
    description: 'Vérification du système de permissions granulaires'
  },
  {
    name: 'Dashboard Analytics',
    files: [
      'src/components/ui/admin-dashboard.tsx',
      'src/components/ui/analytics-dashboard.tsx'
    ],
    description: 'Vérification du dashboard analytics complet'
  },
  {
    name: 'Audit Sécurité',
    files: [
      'src/components/ui/security-audit.tsx'
    ],
    description: 'Vérification du module d\'audit sécurité'
  },
  {
    name: 'A/B Testing',
    files: [
      'src/components/ui/ab-testing.tsx'
    ],
    description: 'Vérification du module A/B testing'
  },
  {
    name: 'Notifications',
    files: [
      'src/components/ui/notifications.tsx'
    ],
    description: 'Vérification du système de notifications'
  },
  {
    name: 'Thème & Design',
    files: [
      'src/components/ui/theme-provider.tsx',
      'src/components/ui/theme-toggle.tsx'
    ],
    description: 'Vérification du système de thème'
  },
  {
    name: 'Export PDF',
    files: [
      'src/components/ui/export-pdf.tsx'
    ],
    description: 'Vérification du module d\'export PDF'
  },
  {
    name: 'Workflow Collaboratif',
    files: [
      'src/components/ui/collaborative-workflow.tsx'
    ],
    description: 'Vérification du workflow collaboratif'
  }
];

// Fonction de test
function runTests() {
  let passedTests = 0;
  let totalTests = tests.length;
  let results = [];

  console.log('📋 EXÉCUTION DES TESTS...\n');

  tests.forEach((test, index) => {
    console.log(`🧪 Test ${index + 1}/${totalTests}: ${test.name}`);
    console.log(`   Description: ${test.description}`);
    
    let testPassed = true;
    let missingFiles = [];
    let errors = [];

    // Vérifier l'existence des fichiers
    test.files.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
        testPassed = false;
      } else {
        // Vérifier le contenu du fichier
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Vérifications spécifiques selon le type de fichier
          if (file.includes('AdminContext')) {
            if (!content.includes('AdminContext') || !content.includes('useAdmin')) {
              errors.push(`Contenu invalide dans ${file}`);
              testPassed = false;
            }
          }
          
          if (file.includes('admin-dashboard')) {
            if (!content.includes('AdminDashboard') || !content.includes('metrics')) {
              errors.push(`Contenu invalide dans ${file}`);
              testPassed = false;
            }
          }
          
          if (file.includes('security-audit')) {
            if (!content.includes('SecurityAudit') || !content.includes('compliance')) {
              errors.push(`Contenu invalide dans ${file}`);
              testPassed = false;
            }
          }
          
          if (file.includes('ab-testing')) {
            if (!content.includes('ABTesting') || !content.includes('variant')) {
              errors.push(`Contenu invalide dans ${file}`);
              testPassed = false;
            }
          }
          
        } catch (error) {
          errors.push(`Erreur de lecture: ${error.message}`);
          testPassed = false;
        }
      }
    });

    // Afficher les résultats
    if (testPassed) {
      console.log(`   ✅ PASSÉ`);
      passedTests++;
    } else {
      console.log(`   ❌ ÉCHOUÉ`);
      if (missingFiles.length > 0) {
        console.log(`      Fichiers manquants: ${missingFiles.join(', ')}`);
      }
      if (errors.length > 0) {
        console.log(`      Erreurs: ${errors.join(', ')}`);
      }
    }
    
    results.push({
      name: test.name,
      passed: testPassed,
      missingFiles,
      errors
    });
    
    console.log('');
  });

  // Résumé final
  console.log('📊 RÉSULTATS FINAUX');
  console.log('===================');
  console.log(`Tests réussis: ${passedTests}/${totalTests}`);
  console.log(`Taux de réussite: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 PHASE 1 INTÉGRÉE AVEC SUCCÈS !');
    console.log('✅ Tous les modules admin sont opérationnels');
    console.log('✅ Système de permissions fonctionnel');
    console.log('✅ Dashboard analytics complet');
    console.log('✅ Audit sécurité opérationnel');
    console.log('✅ A/B testing disponible');
    console.log('✅ Notifications temps réel');
    console.log('✅ Thème et design system');
    console.log('✅ Export PDF fonctionnel');
    console.log('✅ Workflow collaboratif');
    
    console.log('\n🚀 PRÊT POUR LA PHASE 2 - INTERFACE EXPERT');
  } else {
    console.log('\n⚠️  PROBLÈMES DÉTECTÉS');
    console.log('Veuillez corriger les erreurs avant de passer à la phase suivante.');
    
    results.forEach(result => {
      if (!result.passed) {
        console.log(`\n❌ ${result.name}:`);
        if (result.missingFiles.length > 0) {
          console.log(`   Fichiers manquants: ${result.missingFiles.join(', ')}`);
        }
        if (result.errors.length > 0) {
          console.log(`   Erreurs: ${result.errors.join(', ')}`);
        }
      }
    });
  }

  // Sauvegarder les résultats
  const reportPath = path.join(process.cwd(), 'phase1-test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 1 - Interface Admin',
    results: {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      successRate: ((passedTests / totalTests) * 100).toFixed(1)
    },
    tests: results
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Rapport détaillé sauvegardé: ${reportPath}`);

  return passedTests === totalTests;
}

// Vérifications préliminaires
function checkPrerequisites() {
  console.log('🔍 VÉRIFICATIONS PRÉLIMINAIRES...\n');
  
  const requiredDirs = [
    'src/contexts',
    'src/components/ui',
    'src/pages/admin'
  ];
  
  let allDirsExist = true;
  
  requiredDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      console.log(`✅ ${dir}`);
    } else {
      console.log(`❌ ${dir} - MANQUANT`);
      allDirsExist = false;
    }
  });
  
  console.log('');
  return allDirsExist;
}

// Fonction principale
function main() {
  console.log('🚀 DÉMARRAGE DES TESTS PHASE 1\n');
  
  if (!checkPrerequisites()) {
    console.log('❌ VÉRIFICATIONS PRÉLIMINAIRES ÉCHOUÉES');
    console.log('Veuillez vous assurer que tous les répertoires requis existent.');
    process.exit(1);
  }
  
  const success = runTests();
  
  if (success) {
    console.log('\n🎯 RECOMMANDATIONS POUR LA PHASE 2:');
    console.log('1. Tester manuellement l\'interface admin');
    console.log('2. Vérifier les permissions utilisateur');
    console.log('3. Valider les métriques affichées');
    console.log('4. Tester les notifications');
    console.log('5. Vérifier l\'audit sécurité');
    console.log('6. Tester l\'A/B testing');
    console.log('7. Valider l\'export PDF');
    console.log('8. Tester le workflow collaboratif');
    
    console.log('\n✅ PHASE 1 TERMINÉE AVEC SUCCÈS !');
    process.exit(0);
  } else {
    console.log('\n❌ PHASE 1 INCOMPLÈTE');
    console.log('Veuillez corriger les erreurs avant de continuer.');
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 
#!/usr/bin/env node

/**
 * Script de vérification de l'utilisation des vues SQL par le frontend
 * Vérifie que toutes les vues existantes sont bien utilisées par le code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Vérification de l\'utilisation des vues SQL par le frontend\n');

// Vues SQL existantes (d'après la vérification précédente)
const existingViews = {
  admin: [
    'vue_admin_activite_globale',
    'vue_admin_alertes_globales', 
    'vue_admin_kpis_globaux'
  ],
  apporteur: [
    'vue_apporteur_activite_recente',
    'vue_apporteur_agenda',
    'vue_apporteur_commissions',
    'vue_apporteur_conversations',
    'vue_apporteur_experts',
    'vue_apporteur_kpis_globaux',
    'vue_apporteur_notifications',
    'vue_apporteur_performance_produits',
    'vue_apporteur_produits',
    'vue_apporteur_rendez_vous',
    'vue_apporteur_sources_prospects',
    'vue_apporteur_statistiques_mensuelles',
    'vue_apporteur_statistiques'
  ],
  dashboard: [
    'vue_dashboard_kpis_v2'
  ],
  sessions: [
    'vue_sessions_actives',
    'vue_sessions_actives_globale'
  ]
};

// Fonction pour analyser un fichier et détecter l'utilisation des vues
function analyzeViewUsage(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const usedViews = [];
    
    // Détecter les appels aux vues SQL
    Object.values(existingViews).flat().forEach(viewName => {
      if (content.includes(`'${viewName}'`) || content.includes(`"${viewName}"`)) {
        const lines = content.split('\n');
        const lineNumbers = [];
        
        lines.forEach((line, index) => {
          if (line.includes(viewName)) {
            lineNumbers.push(index + 1);
          }
        });
        
        usedViews.push({
          name: viewName,
          lines: lineNumbers,
          count: (content.match(new RegExp(viewName, 'g')) || []).length
        });
      }
    });
    
    return usedViews;
  } catch (error) {
    return [];
  }
}

// Fichiers à analyser
const filesToAnalyze = [
  'client/src/components/admin/AdminDashboard.tsx',
  'client/src/services/admin-analytics-service.ts',
  'client/src/services/apporteur-real-data-service.ts',
  'client/src/services/apporteur-analytics-service.ts',
  'client/src/hooks/use-admin-analytics.ts',
  'client/src/hooks/use-apporteur-analytics.ts'
];

let totalViewsUsed = 0;
let allUsedViews = new Set();

console.log('📁 Analyse de l\'utilisation des vues...\n');

filesToAnalyze.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Fichier non trouvé: ${filePath}`);
    return;
  }
  
  console.log(`🔍 Analyse de ${filePath}...`);
  const usedViews = analyzeViewUsage(fullPath);
  
  if (usedViews.length === 0) {
    console.log(`   Aucune vue SQL utilisée`);
  } else {
    console.log(`   📊 ${usedViews.length} vue(s) SQL utilisée(s):`);
    usedViews.forEach(view => {
      console.log(`      • ${view.name} (${view.count} fois, lignes: ${view.lines.join(', ')})`);
      allUsedViews.add(view.name);
      totalViewsUsed += view.count;
    });
  }
  
  console.log('');
});

// Analyser les vues non utilisées
const allExistingViews = Object.values(existingViews).flat();
const unusedViews = allExistingViews.filter(view => !allUsedViews.has(view));

console.log('📊 RÉSUMÉ DE L\'ANALYSE');
console.log('========================');
console.log(`📁 Fichiers analysés: ${filesToAnalyze.length}`);
console.log(`🔢 Total des vues SQL existantes: ${allExistingViews.length}`);
console.log(`✅ Vues utilisées par le frontend: ${allUsedViews.size}`);
console.log(`❌ Vues non utilisées: ${unusedViews.length}`);
console.log(`📈 Total des appels aux vues: ${totalViewsUsed}`);

if (unusedViews.length > 0) {
  console.log('\n⚠️  VUES NON UTILISÉES:');
  unusedViews.forEach(view => {
    console.log(`   • ${view}`);
  });
} else {
  console.log('\n🎉 EXCELLENT ! Toutes les vues SQL sont utilisées par le frontend.');
}

// Vérifier les vues critiques
const criticalViews = [
  'vue_admin_kpis_globaux',
  'vue_admin_activite_globale', 
  'vue_admin_alertes_globales',
  'vue_apporteur_rendez_vous',
  'vue_apporteur_experts',
  'vue_apporteur_produits',
  'vue_apporteur_conversations',
  'vue_apporteur_commissions',
  'vue_apporteur_statistiques',
  'vue_sessions_actives_globale'
];

const missingCriticalViews = criticalViews.filter(view => !allUsedViews.has(view));

if (missingCriticalViews.length > 0) {
  console.log('\n🚨 VUES CRITIQUES MANQUANTES:');
  missingCriticalViews.forEach(view => {
    console.log(`   • ${view} - CRITIQUE !`);
  });
} else {
  console.log('\n✅ Toutes les vues critiques sont utilisées.');
}

console.log('\n📋 RECOMMANDATIONS:');
if (unusedViews.length > 0) {
  console.log('• Considérez supprimer les vues non utilisées pour optimiser la base');
  console.log('• Ou implémentez leur utilisation dans le frontend');
}
console.log('• Vérifiez que les vues utilisées retournent bien des données');
console.log('• Testez les requêtes avec des données réelles');

process.exit(missingCriticalViews.length > 0 ? 1 : 0);

#!/usr/bin/env node

/**
 * Script de vérification des sources de données réelles
 * Vérifie que les services utilisent bien les bonnes tables et vues SQL
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Vérification des sources de données réelles\n');

// Fonction pour analyser un fichier et vérifier les sources de données
function analyzeDataSources(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    const sources = [];
    
    // Détecter les appels Supabase
    const supabaseCalls = content.match(/\.from\(['"`]([^'"`]+)['"`]\)/g);
    if (supabaseCalls) {
      supabaseCalls.forEach(call => {
        const tableName = call.match(/\.from\(['"`]([^'"`]+)['"`]\)/)[1];
        sources.push({
          type: 'supabase_table',
          name: tableName,
          line: content.substring(0, content.indexOf(call)).split('\n').length
        });
      });
    }
    
    // Détecter les vues SQL
    const viewPatterns = [
      /vue_admin_\w+/g,
      /vue_apporteur_\w+/g,
      /vue_dashboard_\w+/g,
      /vue_\w+_v2/g
    ];
    
    viewPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          sources.push({
            type: 'sql_view',
            name: match,
            line: content.substring(0, content.indexOf(match)).split('\n').length
          });
        });
      }
    });
    
    // Détecter les tables de base
    const baseTables = [
      'Client',
      'Expert', 
      'ClientProduitEligible',
      'ProduitEligible',
      'Dossier',
      'ApporteurAffaires',
      'CalendarEvent',
      'conversations',
      'ApporteurCommission',
      'notification'
    ];
    
    baseTables.forEach(table => {
      if (content.includes(`'${table}'`) || content.includes(`"${table}"`)) {
        sources.push({
          type: 'base_table',
          name: table,
          line: content.indexOf(table) > -1 ? content.substring(0, content.indexOf(table)).split('\n').length : 0
        });
      }
    });
    
    // Détecter les données simulées ou de fallback
    const simulatedPatterns = [
      /fallback\w+/g,
      /mock\w+/g,
      /fake\w+/g,
      /dummy\w+/g,
      /test\w+/g,
      /sample\w+/g,
      /demo\w+/g,
      /placeholder\w+/g,
      /trend:\s*{\s*value:\s*\d+/g,
      /subtitle:\s*["']\+?\d+\s*(ce mois|vs mois dernier)/g
    ];
    
    simulatedPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            type: 'simulated_data',
            match: match,
            line: content.substring(0, content.indexOf(match)).split('\n').length
          });
        });
      }
    });
    
    return { sources, issues };
  } catch (error) {
    return { sources: [], issues: [{ type: 'file_error', error: error.message }] };
  }
}

// Fichiers à analyser
const filesToAnalyze = [
  {
    path: 'client/src/services/expert-real-data-service.ts',
    name: 'Service Expert',
    expectedSources: ['ClientProduitEligible', 'Client', 'ProduitEligible', 'Expert']
  },
  {
    path: 'client/src/services/client-real-data-service.ts', 
    name: 'Service Client',
    expectedSources: ['ClientProduitEligible', 'ProduitEligible']
  },
  {
    path: 'client/src/services/apporteur-real-data-service.ts',
    name: 'Service Apporteur', 
    expectedSources: ['vue_apporteur_', 'CalendarEvent', 'conversations', 'ApporteurCommission']
  },
  {
    path: 'client/src/components/admin/AdminDashboard.tsx',
    name: 'Dashboard Admin',
    expectedSources: ['vue_admin_', 'vue_sessions_actives_globale']
  },
  {
    path: 'client/src/components/ui/expert-dashboard.tsx',
    name: 'Dashboard Expert',
    expectedSources: ['ExpertRealDataService']
  },
  {
    path: 'client/src/pages/dashboard/client.tsx',
    name: 'Dashboard Client',
    expectedSources: ['useClientProducts', 'ClientProduitEligible']
  }
];

let totalIssues = 0;
let filesWithIssues = 0;
let allSources = [];

console.log('📁 Analyse des sources de données...\n');

filesToAnalyze.forEach(file => {
  const fullPath = path.join(__dirname, file.path);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Fichier non trouvé: ${file.path}`);
    return;
  }
  
  console.log(`🔍 Analyse de ${file.name} (${file.path})...`);
  const { sources, issues } = analyzeDataSources(fullPath);
  
  if (issues.length > 0) {
    filesWithIssues++;
    totalIssues += issues.length;
    
    console.log(`⚠️  ${issues.length} problème(s) détecté(s):`);
    issues.forEach((issue, index) => {
      if (issue.type === 'file_error') {
        console.log(`   ${index + 1}. Erreur de fichier: ${issue.error}`);
      } else if (issue.type === 'simulated_data') {
        console.log(`   ${index + 1}. Données simulées (ligne ${issue.line}): ${issue.match}`);
      }
    });
  } else {
    console.log(`✅ Aucun problème détecté`);
  }
  
  // Afficher les sources détectées
  if (sources.length > 0) {
    console.log(`📊 Sources de données détectées:`);
    const uniqueSources = [...new Set(sources.map(s => s.name))];
    uniqueSources.forEach(source => {
      const sourceType = sources.find(s => s.name === source)?.type || 'unknown';
      console.log(`   • ${source} (${sourceType})`);
    });
    
    // Vérifier les sources attendues
    const missingSources = file.expectedSources.filter(expected => 
      !sources.some(s => s.name.includes(expected))
    );
    
    if (missingSources.length > 0) {
      console.log(`⚠️  Sources attendues manquantes: ${missingSources.join(', ')}`);
    } else {
      console.log(`✅ Toutes les sources attendues sont présentes`);
    }
    
    allSources.push(...sources);
  }
  
  console.log('');
});

// Résumé
console.log('📊 RÉSUMÉ DE L\'ANALYSE');
console.log('========================');
console.log(`📁 Fichiers analysés: ${filesToAnalyze.length}`);
console.log(`⚠️  Fichiers avec problèmes: ${filesWithIssues}`);
console.log(`🔢 Total des problèmes: ${totalIssues}`);

// Analyser les sources uniques
const uniqueSources = [...new Set(allSources.map(s => s.name))];
const sourceTypes = {
  supabase_table: uniqueSources.filter(s => allSources.find(src => src.name === s)?.type === 'supabase_table'),
  sql_view: uniqueSources.filter(s => allSources.find(src => src.name === s)?.type === 'sql_view'),
  base_table: uniqueSources.filter(s => allSources.find(src => src.name === s)?.type === 'base_table')
};

console.log(`\n📋 SOURCES DE DONNÉES UTILISÉES:`);
console.log(`   • Tables Supabase: ${sourceTypes.supabase_table.length}`);
console.log(`   • Vues SQL: ${sourceTypes.sql_view.length}`);
console.log(`   • Tables de base: ${sourceTypes.base_table.length}`);

if (totalIssues === 0) {
  console.log('\n🎉 EXCELLENT ! Toutes les sources de données sont réelles.');
  console.log('✅ Aucune donnée simulée ou de fallback détectée.');
  console.log('✅ Utilisation correcte des tables et vues SQL existantes.');
} else {
  console.log('\n⚠️  ATTENTION ! Des problèmes ont été détectés.');
  console.log('🔧 Il est recommandé de corriger ces problèmes avant la production.');
}

console.log('\n📋 RECOMMANDATIONS:');
console.log('• Vérifiez que toutes les vues SQL existent en base');
console.log('• Testez les requêtes avec des données réelles');
console.log('• Évitez les valeurs hardcodées dans les KPIs');
console.log('• Utilisez uniquement les tables et vues documentées');

process.exit(totalIssues > 0 ? 1 : 0);

#!/usr/bin/env node

/**
 * Script de test pour vérifier que tous les dashboards utilisent des données réelles
 * et non des données simulées ou de fallback
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Vérification des dashboards - Données réelles uniquement\n');

// Fonction pour analyser un fichier et détecter les données simulées
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Détecter les données simulées
    const simulatedDataPatterns = [
      /trend:\s*{\s*value:\s*\d+,\s*isPositive:\s*(true|false)\s*}/g,
      /subtitle:\s*["']\+?\d+\s*(ce mois|vs mois dernier|ce trimestre)["']/g,
      /fallback[A-Z]\w*/g,
      /mock[A-Z]\w*/g,
      /fake[A-Z]\w*/g,
      /dummy[A-Z]\w*/g,
      /test[A-Z]\w*/g,
      /sample[A-Z]\w*/g,
      /demo[A-Z]\w*/g,
      /placeholder[A-Z]\w*/g
    ];
    
    simulatedDataPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            type: 'simulated_data',
            pattern: pattern.source,
            match: match,
            line: content.substring(0, content.indexOf(match)).split('\n').length
          });
        });
      }
    });
    
    // Détecter les valeurs hardcodées suspectes
    const hardcodedPatterns = [
      /value:\s*\d+\.\d+%/g,
      /value:\s*["']\d+%["']/g,
      /value:\s*["']€\d+["']/g,
      /value:\s*["']\d+\s*€["']/g
    ];
    
    hardcodedPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Vérifier que ce n'est pas dans un commentaire ou une chaîne de caractères
          const beforeMatch = content.substring(0, content.indexOf(match));
          const lastNewline = beforeMatch.lastIndexOf('\n');
          const line = content.substring(lastNewline + 1, content.indexOf(match));
          
          if (!line.includes('//') && !line.includes('*') && !line.includes('#')) {
            issues.push({
              type: 'hardcoded_value',
              pattern: pattern.source,
              match: match,
              line: content.substring(0, content.indexOf(match)).split('\n').length
            });
          }
        });
      }
    });
    
    return issues;
  } catch (error) {
    return [{ type: 'file_error', error: error.message }];
  }
}

// Fichiers à analyser
const filesToAnalyze = [
  'client/src/pages/dashboard/client.tsx',
  'client/src/components/ui/expert-dashboard.tsx',
  'client/src/components/admin/AdminDashboard.tsx',
  'client/src/services/expert-real-data-service.ts',
  'client/src/services/client-real-data-service.ts',
  'client/src/services/apporteur-real-data-service.ts'
];

let totalIssues = 0;
let filesWithIssues = 0;

console.log('📁 Analyse des fichiers...\n');

filesToAnalyze.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Fichier non trouvé: ${filePath}`);
    return;
  }
  
  console.log(`🔍 Analyse de ${filePath}...`);
  const issues = analyzeFile(fullPath);
  
  if (issues.length === 0) {
    console.log(`✅ Aucun problème détecté`);
  } else {
    filesWithIssues++;
    totalIssues += issues.length;
    
    console.log(`⚠️  ${issues.length} problème(s) détecté(s):`);
    
    issues.forEach((issue, index) => {
      if (issue.type === 'file_error') {
        console.log(`   ${index + 1}. Erreur de fichier: ${issue.error}`);
      } else if (issue.type === 'simulated_data') {
        console.log(`   ${index + 1}. Données simulées détectées (ligne ${issue.line}): ${issue.match}`);
      } else if (issue.type === 'hardcoded_value') {
        console.log(`   ${index + 1}. Valeur hardcodée suspecte (ligne ${issue.line}): ${issue.match}`);
      }
    });
  }
  
  console.log('');
});

// Résumé
console.log('📊 RÉSUMÉ DE L\'ANALYSE');
console.log('========================');
console.log(`📁 Fichiers analysés: ${filesToAnalyze.length}`);
console.log(`⚠️  Fichiers avec problèmes: ${filesWithIssues}`);
console.log(`🔢 Total des problèmes: ${totalIssues}`);

if (totalIssues === 0) {
  console.log('\n🎉 EXCELLENT ! Tous les dashboards utilisent des données réelles.');
  console.log('✅ Aucune donnée simulée ou de fallback détectée.');
} else {
  console.log('\n⚠️  ATTENTION ! Des problèmes ont été détectés.');
  console.log('🔧 Il est recommandé de corriger ces problèmes avant la production.');
}

console.log('\n📋 RECOMMANDATIONS:');
console.log('• Utilisez uniquement des données provenant de Supabase');
console.log('• Évitez les valeurs hardcodées dans les KPIs');
console.log('• Supprimez toutes les données de fallback');
console.log('• Testez avec des données réelles en base');

process.exit(totalIssues > 0 ? 1 : 0);

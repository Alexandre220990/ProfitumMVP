#!/usr/bin/env node

/**
 * Script d'audit de sécurité automatisé
 * Vérifie la conformité RGPD et PCI-DSS
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Couleurs pour les logs
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class SecurityAuditor {
  constructor() {
    this.issues = [];
    this.criticalIssues = 0;
    this.highIssues = 0;
    this.mediumIssues = 0;
    this.lowIssues = 0;
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const color = level === 'error' ? colors.red : 
                  level === 'warning' ? colors.yellow : 
                  level === 'success' ? colors.green : colors.blue;
    
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
  }

  addIssue(severity, message, file = null, line = null) {
    const issue = { severity, message, file, line };
    this.issues.push(issue);
    
    switch(severity) {
      case 'CRITICAL': this.criticalIssues++; break;
      case 'HIGH': this.highIssues++; break;
      case 'MEDIUM': this.mediumIssues++; break;
      case 'LOW': this.lowIssues++; break;
    }
  }

  // Vérifier les secrets exposés
  checkExposedSecrets() {
    this.log('🔍 Vérification des secrets exposés...', 'info');
    
    const filesToCheck = [
      'server/config.py',
      'server/routes.py',
      'server/app.py',
      'server/src/config/supabase.ts',
      'server/src/index.ts',
      'client/src/config/env.ts'
    ];

    const secretPatterns = [
      /JWT_SECRET\s*=\s*['"][^'"]+['"]/g,
      /SUPABASE_URL\s*=\s*['"][^'"]+['"]/g,
      /SUPABASE_KEY\s*=\s*['"][^'"]+['"]/g,
      /password\s*=\s*['"][^'"]+['"]/g,
      /secret\s*=\s*['"][^'"]+['"]/g
    ];

    filesToCheck.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        secretPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              this.addIssue('CRITICAL', `Secret exposé: ${match.substring(0, 50)}...`, file);
            });
          }
        });
      }
    });
  }

  // Vérifier le mode debug
  checkDebugMode() {
    this.log('🔍 Vérification du mode debug...', 'info');
    
    const debugPatterns = [
      /DEBUG\s*=\s*True/g,
      /DEBUG_MODE\s*=\s*True/g,
      /debug\s*=\s*true/g,
      /NODE_ENV\s*=\s*['"]development['"]/g
    ];

    const filesToCheck = [
      'server/config.py',
      'server/app.py',
      'server/src/index.ts',
      'package.json'
    ];

    filesToCheck.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        debugPatterns.forEach(pattern => {
          if (pattern.test(content)) {
            this.addIssue('CRITICAL', 'Mode debug activé en production', file);
          }
        });
      }
    });
  }

  // Vérifier l'authentification
  checkAuthentication() {
    this.log('🔍 Vérification de l\'authentification...', 'info');
    
    const authFiles = [
      'server/src/routes/auth.ts',
      'server/routes/auth.py',
      'server/auth_middleware.py'
    ];

    authFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Vérifier bcrypt
        if (!content.includes('bcrypt') && content.includes('password')) {
          this.addIssue('HIGH', 'Hachage de mot de passe non sécurisé (pas de bcrypt)', file);
        }
        
        // Vérifier 2FA
        if (!content.includes('2fa') && !content.includes('totp') && !content.includes('authenticator')) {
          this.addIssue('HIGH', 'Authentification multi-facteurs non implémentée', file);
        }
        
        // Vérifier la durée des sessions
        if (content.includes('24h') || content.includes('86400')) {
          this.addIssue('MEDIUM', 'Durée de session trop longue (24h)', file);
        }
      }
    });
  }

  // Vérifier le chiffrement
  checkEncryption() {
    this.log('🔍 Vérification du chiffrement...', 'info');
    
    const filesToCheck = [
      'server/src/routes/',
      'server/routes/',
      'client/src/'
    ];

    let hasEncryption = false;
    
    filesToCheck.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = this.getFilesRecursively(dir);
        files.forEach(file => {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('crypto') || content.includes('encrypt') || content.includes('AES')) {
            hasEncryption = true;
          }
        });
      }
    });

    if (!hasEncryption) {
      this.addIssue('HIGH', 'Aucun chiffrement détecté pour les données sensibles');
    }
  }

  // Vérifier CORS
  checkCORS() {
    this.log('🔍 Vérification de la configuration CORS...', 'info');
    
    const corsFiles = [
      'server/app.py',
      'server/src/index.ts',
      'server/src/app.ts'
    ];

    corsFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Vérifier les origines trop permissives
        if (content.includes('*') && content.includes('CORS')) {
          this.addIssue('HIGH', 'CORS configuré avec origine wildcard (*)', file);
        }
        
        // Vérifier les origines de développement en production
        if (content.includes('localhost') && content.includes('production')) {
          this.addIssue('MEDIUM', 'Origines de développement dans la configuration production', file);
        }
      }
    });
  }

  // Vérifier les logs sensibles
  checkSensitiveLogs() {
    this.log('🔍 Vérification des logs sensibles...', 'info');
    
    const logPatterns = [
      /console\.log.*password/gi,
      /console\.log.*token/gi,
      /console\.log.*secret/gi,
      /console\.log.*key/gi,
      /logger.*password/gi,
      /logger.*token/gi
    ];

    const filesToCheck = this.getFilesRecursively('.');
    
    filesToCheck.forEach(file => {
      if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.py')) {
        const content = fs.readFileSync(file, 'utf8');
        
        logPatterns.forEach(pattern => {
          if (pattern.test(content)) {
            this.addIssue('MEDIUM', 'Log de données sensibles détecté', file);
          }
        });
      }
    });
  }

  // Vérifier les dépendances
  async checkDependencies() {
    this.log('🔍 Vérification des dépendances...', 'info');
    
    const packageFiles = ['package.json', 'client/package.json'];
    
    packageFiles.forEach(file => {
      if (fs.existsSync(file)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(file, 'utf8'));
          const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
          
          // Vérifier les versions vulnérables connues
          const vulnerablePackages = [
            'esbuild',
            'brace-expansion',
            '@babel/helpers'
          ];
          
          vulnerablePackages.forEach(pkg => {
            if (dependencies[pkg]) {
              this.addIssue('MEDIUM', `Dépendance potentiellement vulnérable: ${pkg}`, file);
            }
          });
        } catch (error) {
          this.addIssue('LOW', `Erreur lors de l'analyse de ${file}: ${error.message}`, file);
        }
      }
    });
  }

  // Vérifier les fichiers de données sensibles
  checkSensitiveFiles() {
    this.log('🔍 Vérification des fichiers de données sensibles...', 'info');
    
    const sensitiveFiles = [
      'data.json',
      '*.sql',
      '*.env',
      'secrets.json',
      'credentials.json'
    ];

    sensitiveFiles.forEach(pattern => {
      const files = this.getFilesByPattern(pattern);
      files.forEach(file => {
        if (!file.includes('.example') && !file.includes('.template')) {
          this.addIssue('CRITICAL', `Fichier de données sensibles non sécurisé: ${file}`, file);
        }
      });
    });
  }

  // Utilitaires
  getFilesRecursively(dir) {
    const files = [];
    
    if (fs.existsSync(dir)) {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files.push(...this.getFilesRecursively(fullPath));
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      });
    }
    
    return files;
  }

  getFilesByPattern(pattern) {
    const files = [];
    const glob = require('glob');
    
    try {
      const matches = glob.sync(pattern, { ignore: ['node_modules/**', '.git/**'] });
      files.push(...matches);
    } catch (error) {
      // Pattern non supporté, ignorer
    }
    
    return files;
  }

  // Générer le rapport
  generateReport() {
    this.log('\n' + '='.repeat(80), 'info');
    this.log('🔒 RAPPORT D\'AUDIT DE SÉCURITÉ', 'info');
    this.log('='.repeat(80), 'info');
    
    this.log(`\n📊 RÉSUMÉ:`, 'info');
    this.log(`   🔴 CRITIQUE: ${this.criticalIssues}`, this.criticalIssues > 0 ? 'error' : 'success');
    this.log(`   🟠 ÉLEVÉ: ${this.highIssues}`, this.highIssues > 0 ? 'warning' : 'success');
    this.log(`   🟡 MOYEN: ${this.mediumIssues}`, this.mediumIssues > 0 ? 'warning' : 'success');
    this.log(`   🔵 FAIBLE: ${this.lowIssues}`, this.lowIssues > 0 ? 'info' : 'success');
    
    if (this.issues.length > 0) {
      this.log(`\n🚨 PROBLÈMES DÉTECTÉS:`, 'error');
      
      const groupedIssues = this.issues.reduce((acc, issue) => {
        if (!acc[issue.severity]) acc[issue.severity] = [];
        acc[issue.severity].push(issue);
        return acc;
      }, {});
      
      ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
        if (groupedIssues[severity]) {
          this.log(`\n${severity}:`, severity === 'CRITICAL' ? 'error' : severity === 'HIGH' ? 'warning' : 'info');
          groupedIssues[severity].forEach(issue => {
            const fileInfo = issue.file ? ` (${issue.file}${issue.line ? `:${issue.line}` : ''})` : '';
            this.log(`   • ${issue.message}${fileInfo}`, severity === 'CRITICAL' ? 'error' : 'warning');
          });
        }
      });
    } else {
      this.log('\n✅ Aucun problème de sécurité détecté!', 'success');
    }
    
    this.log('\n' + '='.repeat(80), 'info');
    this.log('📋 RECOMMANDATIONS:', 'info');
    this.log('='.repeat(80), 'info');
    
    if (this.criticalIssues > 0) {
      this.log('\n🚨 ACTIONS IMMÉDIATES REQUISES:', 'error');
      this.log('   1. Supprimer tous les secrets exposés du code');
      this.log('   2. Désactiver le mode debug en production');
      this.log('   3. Sécuriser les fichiers de données sensibles');
      this.log('   4. Implémenter l\'authentification multi-facteurs');
    }
    
    if (this.highIssues > 0) {
      this.log('\n⚠️ ACTIONS PRIORITAIRES:', 'warning');
      this.log('   1. Implémenter le chiffrement des données sensibles');
      this.log('   2. Corriger la configuration CORS');
      this.log('   3. Améliorer la gestion des sessions');
    }
    
    this.log('\n📚 RESSOURCES:', 'info');
    this.log('   • RGPD: https://www.cnil.fr/fr/reglement-europeen-protection-donnees');
    this.log('   • PCI-DSS: https://www.pcisecuritystandards.org/');
    this.log('   • OWASP: https://owasp.org/www-project-top-ten/');
    
    this.log('\n' + '='.repeat(80), 'info');
  }

  // Exécuter l'audit complet
  async runFullAudit() {
    this.log('🚀 Démarrage de l\'audit de sécurité...', 'info');
    
    this.checkExposedSecrets();
    this.checkDebugMode();
    this.checkAuthentication();
    this.checkEncryption();
    this.checkCORS();
    this.checkSensitiveLogs();
    await this.checkDependencies();
    this.checkSensitiveFiles();
    
    this.generateReport();
    
    // Retourner le code de sortie approprié
    if (this.criticalIssues > 0) {
      process.exit(1);
    } else if (this.highIssues > 0) {
      process.exit(2);
    } else {
      process.exit(0);
    }
  }
}

// Exécuter l'audit si le script est appelé directement
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runFullAudit().catch(error => {
    console.error('❌ Erreur lors de l\'audit:', error);
    process.exit(1);
  });
}

module.exports = SecurityAuditor; 
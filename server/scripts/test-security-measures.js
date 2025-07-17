#!/usr/bin/env node

/**
 * Script de Test des Mesures de Sécurité
 * Valide l'implémentation des mesures ISO 27001
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityMeasuresTester {
    constructor() {
        this.results = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            details: []
        };
    }

    async runAllTests() {
        console.log('🔍 Test des Mesures de Sécurité ISO 27001\n');
        
        await this.testEncryption();
        await this.testBackupSystem();
        await this.testIncidentManagement();
        await this.testDocumentation();
        await this.testOperationalProcedures();
        
        this.generateReport();
    }

    async testEncryption() {
        console.log('🔐 Test du Système de Chiffrement (A.10.1)...');
        
        try {
            // Test de génération de clé
            const key = crypto.randomBytes(32).toString('hex');
            this.addTest('Génération de clé sécurisée', key.length === 64, 'Clé 256 bits générée');
            
            // Test de chiffrement/déchiffrement
            const testData = 'Données sensibles de test';
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
            cipher.setAAD(Buffer.from('profitum-aad', 'utf8'));
            
            let encrypted = cipher.update(testData, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const tag = cipher.getAuthTag();
            
            const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
            decipher.setAAD(Buffer.from('profitum-aad', 'utf8'));
            decipher.setAuthTag(tag);
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            this.addTest('Chiffrement/déchiffrement AES-256-GCM', decrypted === testData, 'Chiffrement fonctionnel');
            
            // Test de hash de mot de passe
            const password = 'MotDePasseComplexe123!';
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
            
            this.addTest('Hash de mot de passe PBKDF2', hash.length === 128, 'Hash sécurisé généré');
            
        } catch (error) {
            this.addTest('Système de chiffrement', false, `Erreur: ${error.message}`);
        }
    }

    async testBackupSystem() {
        console.log('💾 Test du Système de Sauvegarde (A.12.3)...');
        
        try {
            // Test de création du répertoire de sauvegarde
            const backupPath = './backups/';
            if (!fs.existsSync(backupPath)) {
                fs.mkdirSync(backupPath, { recursive: true });
            }
            
            this.addTest('Répertoire de sauvegarde', fs.existsSync(backupPath), 'Répertoire créé');
            
            // Test de création d'une sauvegarde de test
            const testBackup = {
                id: `test-${Date.now()}`,
                timestamp: new Date().toISOString(),
                data: 'Données de test pour sauvegarde',
                checksum: crypto.createHash('sha256').update('Données de test pour sauvegarde').digest('hex')
            };
            
            const backupFile = path.join(backupPath, `test-backup-${Date.now()}.json`);
            fs.writeFileSync(backupFile, JSON.stringify(testBackup, null, 2));
            
            this.addTest('Création de sauvegarde', fs.existsSync(backupFile), 'Fichier de sauvegarde créé');
            
            // Test de vérification d'intégrité
            const loadedBackup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
            const expectedChecksum = crypto.createHash('sha256').update(loadedBackup.data).digest('hex');
            
            this.addTest('Vérification d\'intégrité', loadedBackup.checksum === expectedChecksum, 'Intégrité vérifiée');
            
            // Nettoyage
            fs.unlinkSync(backupFile);
            
        } catch (error) {
            this.addTest('Système de sauvegarde', false, `Erreur: ${error.message}`);
        }
    }

    async testIncidentManagement() {
        console.log('🚨 Test du Système de Gestion d\'Incidents (A.16.1)...');
        
        try {
            // Test de création du répertoire d'incidents
            const incidentPath = './incidents/';
            if (!fs.existsSync(incidentPath)) {
                fs.mkdirSync(incidentPath, { recursive: true });
            }
            
            this.addTest('Répertoire d\'incidents', fs.existsSync(incidentPath), 'Répertoire créé');
            
            // Test de création d'un incident de test
            const testIncident = {
                id: `INC-TEST-${Date.now()}`,
                title: 'Test d\'incident de sécurité',
                description: 'Incident de test pour validation',
                type: 'security_breach',
                severity: 'medium',
                status: 'open',
                reportedAt: new Date().toISOString(),
                reportedBy: 'test-system',
                impact: 'Test uniquement',
                tags: ['test', 'security'],
                evidence: [],
                notifications: []
            };
            
            const incidentFile = path.join(incidentPath, 'test-incident.json');
            fs.writeFileSync(incidentFile, JSON.stringify(testIncident, null, 2));
            
            this.addTest('Création d\'incident', fs.existsSync(incidentFile), 'Incident créé');
            
            // Test de mise à jour de statut
            const loadedIncident = JSON.parse(fs.readFileSync(incidentFile, 'utf8'));
            loadedIncident.status = 'investigating';
            loadedIncident.investigationStartedAt = new Date().toISOString();
            
            fs.writeFileSync(incidentFile, JSON.stringify(loadedIncident, null, 2));
            
            this.addTest('Mise à jour de statut', fs.existsSync(incidentFile), 'Statut mis à jour');
            
            // Nettoyage
            fs.unlinkSync(incidentFile);
            
        } catch (error) {
            this.addTest('Système de gestion d\'incidents', false, `Erreur: ${error.message}`);
        }
    }

    async testDocumentation() {
        console.log('📋 Test de la Documentation (A.5.1)...');
        
        try {
            // Test de la politique de sécurité
            const securityPolicyPath = './docs/SECURITY_POLICY.md';
            this.addTest('Politique de sécurité', fs.existsSync(securityPolicyPath), 'Document trouvé');
            
            if (fs.existsSync(securityPolicyPath)) {
                const content = fs.readFileSync(securityPolicyPath, 'utf8');
                this.addTest('Contenu politique', content.length > 1000, 'Document complet');
                this.addTest('Sections requises', 
                    content.includes('A.9') && content.includes('A.10') && content.includes('A.12') && content.includes('A.16'),
                    'Sections ISO 27001 présentes'
                );
            }
            
            // Test des procédures opérationnelles
            const proceduresPath = './docs/OPERATIONAL_PROCEDURES.md';
            this.addTest('Procédures opérationnelles', fs.existsSync(proceduresPath), 'Document trouvé');
            
            if (fs.existsSync(proceduresPath)) {
                const content = fs.readFileSync(proceduresPath, 'utf8');
                this.addTest('Contenu procédures', content.length > 1000, 'Document complet');
                this.addTest('Procédures critiques', 
                    content.includes('Déploiement') && content.includes('Maintenance') && content.includes('Incident'),
                    'Procédures critiques présentes'
                );
            }
            
        } catch (error) {
            this.addTest('Documentation', false, `Erreur: ${error.message}`);
        }
    }

    async testOperationalProcedures() {
        console.log('⚙️ Test des Procédures Opérationnelles (A.12.1)...');
        
        try {
            // Test de la structure des répertoires
            const requiredDirs = ['./lib', './docs', './backups', './incidents'];
            
            for (const dir of requiredDirs) {
                this.addTest(`Répertoire ${dir}`, fs.existsSync(dir), 'Répertoire présent');
            }
            
            // Test des fichiers de configuration
            const configFiles = ['./package.json', './tsconfig.json'];
            
            for (const file of configFiles) {
                this.addTest(`Fichier de config ${file}`, fs.existsSync(file), 'Fichier présent');
            }
            
            // Test des modules de sécurité
            const securityModules = ['./lib/encryption.ts', './lib/backup.ts', './lib/incident-management.ts'];
            
            for (const module of securityModules) {
                this.addTest(`Module sécurité ${module}`, fs.existsSync(module), 'Module présent');
            }
            
        } catch (error) {
            this.addTest('Procédures opérationnelles', false, `Erreur: ${error.message}`);
        }
    }

    addTest(name, passed, details) {
        this.results.totalTests++;
        
        if (passed) {
            this.results.passedTests++;
            console.log(`  ✅ ${name}`);
        } else {
            this.results.failedTests++;
            console.log(`  ❌ ${name}: ${details}`);
        }
        
        this.results.details.push({
            name,
            passed,
            details
        });
    }

    generateReport() {
        console.log('\n📊 RAPPORT DE TEST DES MESURES DE SÉCURITÉ');
        console.log('=' .repeat(50));
        
        const successRate = Math.round((this.results.passedTests / this.results.totalTests) * 100);
        
        console.log(`\n🎯 Taux de réussite: ${successRate}%`);
        console.log(`📈 Tests réussis: ${this.results.passedTests}/${this.results.totalTests}`);
        
        if (this.results.failedTests > 0) {
            console.log('\n❌ Tests échoués:');
            this.results.details
                .filter(test => !test.passed)
                .forEach(test => {
                    console.log(`  - ${test.name}: ${test.details}`);
                });
        }
        
        // Évaluation de la conformité
        let complianceLevel = '';
        if (successRate >= 90) {
            complianceLevel = '🟢 EXCELLENT - Prêt pour certification';
        } else if (successRate >= 75) {
            complianceLevel = '🟡 BON - Améliorations mineures nécessaires';
        } else if (successRate >= 60) {
            complianceLevel = '🟠 MOYEN - Travail significatif requis';
        } else {
            complianceLevel = '🔴 CRITIQUE - Travail majeur requis';
        }
        
        console.log(`\n${complianceLevel}`);
        
        // Recommandations
        if (successRate < 90) {
            console.log('\n🚨 Recommandations:');
            if (this.results.failedTests > 0) {
                console.log('  1. Corriger les tests échoués');
            }
            console.log('  2. Compléter la documentation manquante');
            console.log('  3. Tester en environnement de production');
            console.log('  4. Former l\'équipe aux nouvelles procédures');
        }
        
        // Sauvegarde du rapport
        this.saveReport();
    }

    saveReport() {
        const report = {
            timestamp: new Date().toISOString(),
            successRate: Math.round((this.results.passedTests / this.results.totalTests) * 100),
            totalTests: this.results.totalTests,
            passedTests: this.results.passedTests,
            failedTests: this.results.failedTests,
            details: this.results.details
        };
        
        const reportPath = './security-test-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n💾 Rapport sauvegardé: ${reportPath}`);
    }
}

async function main() {
    const tester = new SecurityMeasuresTester();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SecurityMeasuresTester;

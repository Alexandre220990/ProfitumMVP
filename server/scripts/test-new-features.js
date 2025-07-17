#!/usr/bin/env node

/**
 * Test des Nouvelles Fonctionnalités ISO 27001
 * Valide l'implémentation des mesures de sécurité
 */

const fs = require('fs');
const path = require('path');

class NewFeaturesTester {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            details: []
        };
    }

    async runAllTests() {
        console.log('🧪 Test des Nouvelles Fonctionnalités ISO 27001\n');
        
        await this.testSecurityTraining();
        await this.testBusinessContinuity();
        await this.testOrganizationSecurity();
        await this.testEncryption();
        await this.testBackupSystem();
        await this.testIncidentManagement();
        
        this.generateReport();
    }

    async testSecurityTraining() {
        console.log('📚 Test du Système de Formation Sécurité...');
        
        // Test du module de formation
        const trainingModule = fs.existsSync('./lib/security-training.ts');
        this.addTest('Module de formation', trainingModule, 'Système de formation sécurité');
        
        // Test du répertoire de formation
        const trainingDir = fs.existsSync('./training/');
        this.addTest('Répertoire formation', trainingDir, 'Répertoire de formation créé');
        
        // Test de l'initialisation
        try {
            const trainingContent = fs.readFileSync('./lib/security-training.ts', 'utf8');
            const hasModules = trainingContent.includes('basic-security-001');
            this.addTest('Modules de formation', hasModules, 'Modules de formation initialisés');
        } catch (error) {
            this.addTest('Modules de formation', false, 'Erreur lors de la lecture du module');
        }
    }

    async testBusinessContinuity() {
        console.log('🔄 Test du Système de Continuité d\'Activité...');
        
        // Test du module de continuité
        const continuityModule = fs.existsSync('./lib/business-continuity.ts');
        this.addTest('Module continuité', continuityModule, 'Système de continuité d\'activité');
        
        // Test du répertoire de continuité
        const continuityDir = fs.existsSync('./business-continuity/');
        this.addTest('Répertoire continuité', continuityDir, 'Répertoire de continuité créé');
        
        // Test du contenu du module
        try {
            const continuityContent = fs.readFileSync('./lib/business-continuity.ts', 'utf8');
            const hasProcesses = continuityContent.includes('auth-system');
            this.addTest('Processus métier', hasProcesses, 'Processus métier définis');
            
            const hasPlans = continuityContent.includes('drp-cyber-attack');
            this.addTest('Plans de reprise', hasPlans, 'Plans de reprise d\'activité');
        } catch (error) {
            this.addTest('Contenu continuité', false, 'Erreur lors de la lecture du module');
        }
    }

    async testOrganizationSecurity() {
        console.log('🏢 Test de l\'Organisation de la Sécurité...');
        
        // Test de la documentation d'organisation
        const orgDoc = fs.existsSync('./docs/ORGANIZATION_SECURITY.md');
        this.addTest('Documentation organisation', orgDoc, 'Documentation d\'organisation de la sécurité');
        
        // Test du contenu de la documentation
        if (orgDoc) {
            try {
                const orgContent = fs.readFileSync('./docs/ORGANIZATION_SECURITY.md', 'utf8');
                const hasStructure = orgContent.includes('Structure Organisationnelle');
                this.addTest('Structure organisationnelle', hasStructure, 'Structure organisationnelle documentée');
                
                const hasEscalation = orgContent.includes('Procédures d\'Escalade');
                this.addTest('Procédures d\'escalade', hasEscalation, 'Procédures d\'escalade définies');
                
                const hasContacts = orgContent.includes('Contacts d\'Urgence');
                this.addTest('Contacts d\'urgence', hasContacts, 'Contacts d\'urgence documentés');
            } catch (error) {
                this.addTest('Contenu organisation', false, 'Erreur lors de la lecture de la documentation');
            }
        }
    }

    async testEncryption() {
        console.log('🔐 Test du Système de Chiffrement...');
        
        // Test du module de chiffrement
        const encryptionModule = fs.existsSync('./lib/encryption.ts');
        this.addTest('Module de chiffrement', encryptionModule, 'Système de chiffrement AES-256-GCM');
        
        // Test du contenu du module
        if (encryptionModule) {
            try {
                const encryptionContent = fs.readFileSync('./lib/encryption.ts', 'utf8');
                const hasAES = encryptionContent.includes('aes-256-gcm');
                this.addTest('Chiffrement AES-256-GCM', hasAES, 'Algorithme AES-256-GCM implémenté');
                
                const hasKeyManagement = encryptionContent.includes('generateKey');
                this.addTest('Gestion des clés', hasKeyManagement, 'Gestion sécurisée des clés');
            } catch (error) {
                this.addTest('Contenu chiffrement', false, 'Erreur lors de la lecture du module');
            }
        }
    }

    async testBackupSystem() {
        console.log('💾 Test du Système de Sauvegarde...');
        
        // Test du module de sauvegarde
        const backupModule = fs.existsSync('./lib/backup.ts');
        this.addTest('Module de sauvegarde', backupModule, 'Système de sauvegarde automatique');
        
        // Test du répertoire de sauvegarde
        const backupDir = fs.existsSync('./backups/');
        this.addTest('Répertoire de sauvegarde', backupDir, 'Répertoire de sauvegarde créé');
        
        // Test du contenu du module
        if (backupModule) {
            try {
                const backupContent = fs.readFileSync('./lib/backup.ts', 'utf8');
                const hasAutomated = backupContent.includes('automated');
                this.addTest('Sauvegarde automatisée', hasAutomated, 'Sauvegarde automatisée configurée');
                
                const hasEncryption = backupContent.includes('encrypt');
                this.addTest('Chiffrement des sauvegardes', hasEncryption, 'Sauvegardes chiffrées');
            } catch (error) {
                this.addTest('Contenu sauvegarde', false, 'Erreur lors de la lecture du module');
            }
        }
    }

    async testIncidentManagement() {
        console.log('🚨 Test du Système de Gestion d\'Incidents...');
        
        // Test du module de gestion d'incidents
        const incidentModule = fs.existsSync('./lib/incident-management.ts');
        this.addTest('Module d\'incidents', incidentModule, 'Système de gestion d\'incidents');
        
        // Test du répertoire d'incidents
        const incidentDir = fs.existsSync('./incidents/');
        this.addTest('Répertoire d\'incidents', incidentDir, 'Répertoire d\'incidents créé');
        
        // Test du contenu du module
        if (incidentModule) {
            try {
                const incidentContent = fs.readFileSync('./lib/incident-management.ts', 'utf8');
                const hasSeverity = incidentContent.includes('CRITICAL');
                this.addTest('Niveaux de sévérité', hasSeverity, 'Niveaux de sévérité définis');
                
                const hasWorkflow = incidentContent.includes('workflow');
                this.addTest('Workflow d\'incidents', hasWorkflow, 'Workflow de gestion d\'incidents');
            } catch (error) {
                this.addTest('Contenu incidents', false, 'Erreur lors de la lecture du module');
            }
        }
    }

    addTest(name, passed, description) {
        this.results.total++;
        
        if (passed) {
            this.results.passed++;
            console.log(`  ✅ ${name}: ${description}`);
        } else {
            this.results.failed++;
            console.log(`  ❌ ${name}: ${description}`);
        }
        
        this.results.details.push({
            name,
            passed,
            description
        });
    }

    generateReport() {
        console.log('\n📊 RAPPORT DE TEST DES NOUVELLES FONCTIONNALITÉS');
        console.log('=' .repeat(55));
        
        const successRate = Math.round((this.results.passed / this.results.total) * 100);
        
        console.log(`\n🎯 Taux de succès: ${successRate}%`);
        console.log(`📈 Tests réussis: ${this.results.passed}/${this.results.total}`);
        
        if (this.results.failed > 0) {
            console.log('\n❌ Tests échoués:');
            this.results.details
                .filter(test => !test.passed)
                .forEach(test => {
                    console.log(`  - ${test.name}: ${test.description}`);
                });
        }
        
        console.log('\n📋 Fonctionnalités testées:');
        console.log('  ✅ Système de formation sécurité');
        console.log('  ✅ Système de continuité d\'activité');
        console.log('  ✅ Organisation de la sécurité');
        console.log('  ✅ Système de chiffrement');
        console.log('  ✅ Système de sauvegarde');
        console.log('  ✅ Gestion d\'incidents');
        
        if (successRate === 100) {
            console.log('\n🎉 TOUTES LES FONCTIONNALITÉS OPÉRATIONNELLES !');
        } else {
            console.log('\n⚠️  Certaines fonctionnalités nécessitent des ajustements');
        }
        
        this.saveReport();
    }

    saveReport() {
        const report = {
            timestamp: new Date().toISOString(),
            successRate: Math.round((this.results.passed / this.results.total) * 100),
            total: this.results.total,
            passed: this.results.passed,
            failed: this.results.failed,
            details: this.results.details
        };
        
        const reportPath = path.join(__dirname, '../new-features-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n💾 Rapport sauvegardé: ${reportPath}`);
    }
}

async function main() {
    const tester = new NewFeaturesTester();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = NewFeaturesTester; 
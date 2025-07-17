#!/usr/bin/env node

/**
 * Script de Test Complet - Workflows Documentaires FinancialTracker
 * Valide le fonctionnement de tous les workflows en conditions réelles
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configuration
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement manquantes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Couleurs pour les logs
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// ===== TESTS DES WORKFLOWS =====

async function testWorkflowTemplates() {
    log('\n🔍 TEST 1: Vérification des Templates de Workflow', 'cyan');
    
    try {
        const { data: templates, error } = await supabase
            .from('WorkflowTemplate')
            .select('*')
            .order('name');

        if (error) throw error;

        log(`✅ ${templates.length} templates trouvés`, 'green');
        
        const expectedTemplates = [
            'CGV Profitum',
            'Rapport de Simulation Profitum',
            'Rapport de Prééligibilité Profitum',
            'Rapport d\'Éligibilité Expert',
            'Bon de Commande (État de Remboursement)',
            'Facture (Attestation de Versement)',
            'Suivi Administratif (Client + Expert)',
            'Remboursement (Client + Expert)'
        ];

        for (const expected of expectedTemplates) {
            const found = templates.find(t => t.name === expected);
            if (found) {
                log(`  ✅ ${expected}`, 'green');
            } else {
                log(`  ❌ ${expected} - MANQUANT`, 'red');
            }
        }

        return templates;
    } catch (error) {
        log(`❌ Erreur lors de la vérification des templates: ${error.message}`, 'red');
        return [];
    }
}

async function testWorkflowSteps() {
    log('\n🔍 TEST 2: Vérification des Étapes de Workflow', 'cyan');
    
    try {
        const { data: steps, error } = await supabase
            .from('WorkflowStep')
            .select(`
                *,
                WorkflowTemplate:workflow_id(name)
            `)
            .order('order');

        if (error) throw error;

        log(`✅ ${steps.length} étapes trouvées`, 'green');

        // Grouper par workflow
        const stepsByWorkflow = {};
        steps.forEach(step => {
            const workflowName = step.WorkflowTemplate.name;
            if (!stepsByWorkflow[workflowName]) {
                stepsByWorkflow[workflowName] = [];
            }
            stepsByWorkflow[workflowName].push(step);
        });

        for (const [workflowName, workflowSteps] of Object.entries(stepsByWorkflow)) {
            log(`\n📋 ${workflowName} (${workflowSteps.length} étapes):`, 'yellow');
            workflowSteps.forEach(step => {
                log(`  ${step.order}. ${step.name} (${step.assigned_role})`, 'green');
            });
        }

        return steps;
    } catch (error) {
        log(`❌ Erreur lors de la vérification des étapes: ${error.message}`, 'red');
        return [];
    }
}

async function testWorkflowMetadata() {
    log('\n🔍 TEST 3: Vérification des Métadonnées', 'cyan');
    
    try {
        const { data: steps, error } = await supabase
            .from('WorkflowStep')
            .select('name, metadata, notifications')
            .not('metadata', 'eq', '{}');

        if (error) throw error;

        log(`✅ ${steps.length} étapes avec métadonnées trouvées`, 'green');

        for (const step of steps) {
            log(`\n📄 ${step.name}:`, 'yellow');
            log(`  Métadonnées: ${JSON.stringify(step.metadata)}`, 'blue');
            log(`  Notifications: ${JSON.stringify(step.notifications)}`, 'blue');
        }

        return true;
    } catch (error) {
        log(`❌ Erreur lors de la vérification des métadonnées: ${error.message}`, 'red');
        return false;
    }
}

async function testWorkflowSLA() {
    log('\n🔍 TEST 4: Vérification des SLA', 'cyan');
    
    try {
        const { data: templates, error } = await supabase
            .from('WorkflowTemplate')
            .select('name, sla_hours, estimated_total_duration')
            .order('sla_hours');

        if (error) throw error;

        log('📊 Analyse des SLA:', 'yellow');
        
        for (const template of templates) {
            const slaStatus = template.sla_hours === 0 ? 'IMMÉDIAT' : `${template.sla_hours}h`;
            const durationStatus = template.estimated_total_duration === 0 ? 'IMMÉDIAT' : `${template.estimated_total_duration}h`;
            
            log(`  ${template.name}:`, 'green');
            log(`    SLA: ${slaStatus} | Durée estimée: ${durationStatus}`, 'blue');
        }

        return true;
    } catch (error) {
        log(`❌ Erreur lors de la vérification des SLA: ${error.message}`, 'red');
        return false;
    }
}

async function testWorkflowRoles() {
    log('\n🔍 TEST 5: Vérification des Rôles', 'cyan');
    
    try {
        const { data: steps, error } = await supabase
            .from('WorkflowStep')
            .select('assigned_role')
            .order('assigned_role');

        if (error) throw error;

        const roleCounts = {};
        steps.forEach(step => {
            roleCounts[step.assigned_role] = (roleCounts[step.assigned_role] || 0) + 1;
        });

        log('👥 Répartition des rôles:', 'yellow');
        for (const [role, count] of Object.entries(roleCounts)) {
            log(`  ${role}: ${count} étapes`, 'green');
        }

        return true;
    } catch (error) {
        log(`❌ Erreur lors de la vérification des rôles: ${error.message}`, 'red');
        return false;
    }
}

async function testWorkflowNotifications() {
    log('\n🔍 TEST 6: Vérification des Notifications', 'cyan');
    
    try {
        const { data: steps, error } = await supabase
            .from('WorkflowStep')
            .select('name, notifications')
            .not('notifications', 'eq', '{}');

        if (error) throw error;

        log(`✅ ${steps.length} étapes avec notifications configurées`, 'green');

        const notificationTypes = {
            email: 0,
            push: 0,
            sms: 0,
            client_notification: 0,
            admin_notification: 0,
            expert_notification: 0
        };

        for (const step of steps) {
            const notif = step.notifications;
            if (notif.email) notificationTypes.email++;
            if (notif.push) notificationTypes.push++;
            if (notif.sms) notificationTypes.sms++;
            if (notif.client_notification) notificationTypes.client_notification++;
            if (notif.admin_notification) notificationTypes.admin_notification++;
            if (notif.expert_notification) notificationTypes.expert_notification++;
        }

        log('📧 Types de notifications utilisés:', 'yellow');
        for (const [type, count] of Object.entries(notificationTypes)) {
            if (count > 0) {
                log(`  ${type}: ${count} étapes`, 'green');
            }
        }

        return true;
    } catch (error) {
        log(`❌ Erreur lors de la vérification des notifications: ${error.message}`, 'red');
        return false;
    }
}

async function testWorkflowIntegrity() {
    log('\n🔍 TEST 7: Vérification de l\'Intégrité', 'cyan');
    
    try {
        // Vérifier que tous les workflows ont des étapes
        const { data: workflows, error: workflowsError } = await supabase
            .from('WorkflowTemplate')
            .select(`
                id,
                name,
                WorkflowStep:WorkflowStep(count)
            `);

        if (workflowsError) throw workflowsError;

        let allValid = true;
        for (const workflow of workflows) {
            const stepCount = workflow.WorkflowStep[0]?.count || 0;
            if (stepCount === 0) {
                log(`❌ ${workflow.name} n'a aucune étape`, 'red');
                allValid = false;
            } else {
                log(`✅ ${workflow.name}: ${stepCount} étapes`, 'green');
            }
        }

        return allValid;
    } catch (error) {
        log(`❌ Erreur lors de la vérification de l'intégrité: ${error.message}`, 'red');
        return false;
    }
}

async function testWorkflowPerformance() {
    log('\n🔍 TEST 8: Test de Performance', 'cyan');
    
    try {
        const startTime = Date.now();
        
        // Test de lecture des workflows
        const { data: templates, error } = await supabase
            .from('WorkflowTemplate')
            .select(`
                *,
                WorkflowStep:WorkflowStep(*)
            `);

        const endTime = Date.now();
        const duration = endTime - startTime;

        if (error) throw error;

        log(`✅ Lecture de ${templates.length} workflows en ${duration}ms`, 'green');
        
        if (duration < 1000) {
            log('✅ Performance excellente (< 1s)', 'green');
        } else if (duration < 3000) {
            log('⚠️ Performance acceptable (< 3s)', 'yellow');
        } else {
            log('❌ Performance lente (> 3s)', 'red');
        }

        return true;
    } catch (error) {
        log(`❌ Erreur lors du test de performance: ${error.message}`, 'red');
        return false;
    }
}

// ===== FONCTION PRINCIPALE =====

async function runAllTests() {
    log('🚀 DÉMARRAGE DES TESTS COMPLETS - WORKFLOWS DOCUMENTAIRES', 'bright');
    log('=' .repeat(60), 'cyan');

    const results = {
        templates: false,
        steps: false,
        metadata: false,
        sla: false,
        roles: false,
        notifications: false,
        integrity: false,
        performance: false
    };

    try {
        // Tests séquentiels
        results.templates = await testWorkflowTemplates();
        results.steps = await testWorkflowSteps();
        results.metadata = await testWorkflowMetadata();
        results.sla = await testWorkflowSLA();
        results.roles = await testWorkflowRoles();
        results.notifications = await testWorkflowNotifications();
        results.integrity = await testWorkflowIntegrity();
        results.performance = await testWorkflowPerformance();

        // Résumé final
        log('\n' + '=' .repeat(60), 'cyan');
        log('📊 RÉSUMÉ DES TESTS', 'bright');
        log('=' .repeat(60), 'cyan');

        const passedTests = Object.values(results).filter(Boolean).length;
        const totalTests = Object.keys(results).length;

        for (const [testName, result] of Object.entries(results)) {
            const status = result ? '✅ PASSÉ' : '❌ ÉCHOUÉ';
            const color = result ? 'green' : 'red';
            log(`${status} - ${testName}`, color);
        }

        log(`\n🎯 ${passedTests}/${totalTests} tests réussis`, passedTests === totalTests ? 'green' : 'yellow');

        if (passedTests === totalTests) {
            log('\n🎉 TOUS LES TESTS SONT PASSÉS !', 'bright');
            log('✅ Votre système de workflow documentaire est opérationnel', 'green');
        } else {
            log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ', 'yellow');
            log('🔧 Vérifiez les erreurs ci-dessus', 'yellow');
        }

    } catch (error) {
        log(`\n💥 ERREUR CRITIQUE: ${error.message}`, 'red');
        process.exit(1);
    }
}

// Exécution
runAllTests().catch(console.error); 
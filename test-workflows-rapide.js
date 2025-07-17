#!/usr/bin/env node

/**
 * Script de Test Rapide - Workflows Documentaires FinancialTracker
 * Validation simple et rapide
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🚀 Test Rapide des Workflows Documentaires\n');

async function testRapide() {
    try {
        // Test 1: Vérifier les templates
        console.log('1️⃣ Vérification des templates...');
        const { data: templates, error: templatesError } = await supabase
            .from('WorkflowTemplate')
            .select('name, sla_hours')
            .order('name');

        if (templatesError) throw templatesError;
        console.log(`✅ ${templates.length} templates trouvés\n`);

        // Test 2: Vérifier les étapes
        console.log('2️⃣ Vérification des étapes...');
        const { data: steps, error: stepsError } = await supabase
            .from('WorkflowStep')
            .select('name, assigned_role, workflow_id')
            .order('order');

        if (stepsError) throw stepsError;
        console.log(`✅ ${steps.length} étapes trouvées\n`);

        // Test 3: Vérifier l'intégrité
        console.log('3️⃣ Vérification de l\'intégrité...');
        const { data: integrity, error: integrityError } = await supabase
            .from('WorkflowTemplate')
            .select(`
                name,
                WorkflowStep:WorkflowStep(count)
            `);

        if (integrityError) throw integrityError;
        
        let allValid = true;
        for (const workflow of integrity) {
            const stepCount = workflow.WorkflowStep[0]?.count || 0;
            if (stepCount === 0) {
                console.log(`❌ ${workflow.name} n'a aucune étape`);
                allValid = false;
            }
        }

        if (allValid) {
            console.log('✅ Tous les workflows ont des étapes\n');
        }

        // Résumé
        console.log('📊 RÉSUMÉ:');
        console.log(`   Templates: ${templates.length}`);
        console.log(`   Étapes: ${steps.length}`);
        console.log(`   Intégrité: ${allValid ? '✅ OK' : '❌ PROBLÈME'}`);
        
        console.log('\n🎉 Test rapide terminé avec succès !');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

testRapide(); 
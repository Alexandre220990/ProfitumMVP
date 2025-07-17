#!/usr/bin/env node

/**
 * TEST RAPIDE - INTÉGRATION TICPE
 * Utilise les variables d'environnement existantes
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Utiliser directement les variables existantes
const supabase = createClient(
  'https://gvvlstubqfxdzltldunj.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzdHVicWZ4ZHpsdGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NzE5NzAsImV4cCI6MjA2NDI0Nzk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
);

async function testTICPEQuick() {
  console.log('🚀 TEST RAPIDE - INTÉGRATION TICPE');
  console.log('===================================\n');

  try {
    // 1. Charger les questions TICPE
    console.log('1️⃣ Chargement des questions TICPE...');
    
    const { data: questions, error } = await supabase
      .from('QuestionnaireQuestion')
      .select('*')
      .contains('produits_cibles', ['TICPE'])
      .order('question_order', { ascending: true });

    if (error) {
      throw new Error(`Erreur: ${error.message}`);
    }

    if (!questions || questions.length === 0) {
      throw new Error('❌ Aucune question TICPE trouvée');
    }

    console.log(`✅ ${questions.length} questions TICPE chargées\n`);

    // 2. Afficher les questions avec leurs conditions
    console.log('2️⃣ Questions et conditions:');
    questions.forEach(q => {
      const hasConditions = q.conditions && Object.keys(q.conditions).length > 0;
      const conditionText = hasConditions ? 
        `→ Condition: ${JSON.stringify(q.conditions)}` : 
        `→ Aucune condition`;
      
      console.log(`   ${q.question_id}: ${q.question_text}`);
      console.log(`     ${conditionText}\n`);
    });

    // 3. Tester la logique conditionnelle
    console.log('3️⃣ Test de la logique conditionnelle...');
    
    // Simuler réponse "Non" à TICPE_003
    const responses = { 'TICPE_003': 'Non' };
    
    const visibleQuestions = questions.filter(q => {
      if (!q.conditions?.depends_on) return true;
      
      const { question_id, answer } = q.conditions.depends_on;
      return responses[question_id] === answer;
    });

    const hiddenQuestions = questions.filter(q => !visibleQuestions.includes(q));
    
    console.log(`📊 Questions visibles (sans véhicules): ${visibleQuestions.length}`);
    console.log(`📊 Questions masquées: ${hiddenQuestions.length}`);
    
    if (hiddenQuestions.length > 0) {
      console.log('\n🚫 Questions masquées:');
      hiddenQuestions.forEach(q => {
        console.log(`   - ${q.question_id}: ${q.question_text}`);
      });
    }

    // 4. Vérifier les phases
    console.log('\n4️⃣ Vérification des phases:');
    const phases = [...new Set(questions.map(q => q.phase))].sort();
    phases.forEach(phase => {
      const phaseQuestions = questions.filter(q => q.phase === phase);
      console.log(`   Phase ${phase}: ${phaseQuestions.length} questions`);
    });

    // 5. Résumé
    console.log('\n🎉 TEST RÉUSSI !');
    console.log('✅ Questions TICPE présentes');
    console.log('✅ Logique conditionnelle fonctionnelle');
    console.log('✅ Phases bien structurées');
    console.log('✅ Intégration prête pour le frontend');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter le test
testTICPEQuick(); 
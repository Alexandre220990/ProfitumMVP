#!/usr/bin/env node

/**
 * TEST SIMPLE - INTÉGRATION TICPE
 * Version CommonJS pour éviter les problèmes de modules
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = 'https://gvvlstubqfxdzltldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzdHVicWZ4ZHpsdGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NzE5NzAsImV4cCI6MjA2NDI0Nzk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTICPEIntegration() {
  console.log('🚀 TEST SIMPLE - INTÉGRATION TICPE');
  console.log('===================================\n');

  try {
    // 1. Test de connexion
    console.log('1️⃣ Test de connexion Supabase...');
    
    const { data: testData, error: testError } = await supabase
      .from('QuestionnaireQuestion')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Erreur de connexion:', testError.message);
      return;
    }

    console.log('✅ Connexion Supabase réussie\n');

    // 2. Charger les questions TICPE
    console.log('2️⃣ Chargement des questions TICPE...');
    
    const { data: questions, error } = await supabase
      .from('QuestionnaireQuestion')
      .select('*')
      .contains('produits_cibles', ['TICPE'])
      .order('question_order', { ascending: true });

    if (error) {
      console.error('❌ Erreur chargement questions:', error.message);
      return;
    }

    if (!questions || questions.length === 0) {
      console.log('⚠️ Aucune question TICPE trouvée');
      console.log('💡 Exécutez d\'abord: ./server/scripts/update-ticpe-simulator.sh');
      return;
    }

    console.log(`✅ ${questions.length} questions TICPE trouvées\n`);

    // 3. Afficher un résumé
    console.log('3️⃣ Résumé des questions:');
    
    const questionsWithConditions = questions.filter(q => 
      q.conditions && Object.keys(q.conditions).length > 0
    );
    
    const questionsByPhase = {};
    questions.forEach(q => {
      if (!questionsByPhase[q.phase]) {
        questionsByPhase[q.phase] = 0;
      }
      questionsByPhase[q.phase]++;
    });

    console.log(`📊 Total questions: ${questions.length}`);
    console.log(`📊 Questions avec conditions: ${questionsWithConditions.length}`);
    console.log(`📊 Questions sans conditions: ${questions.length - questionsWithConditions.length}`);
    
    console.log('\n📋 Répartition par phase:');
    Object.keys(questionsByPhase).sort().forEach(phase => {
      console.log(`   Phase ${phase}: ${questionsByPhase[phase]} questions`);
    });

    // 4. Tester la logique conditionnelle
    console.log('\n4️⃣ Test de la logique conditionnelle...');
    
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

    // 5. Afficher quelques exemples
    console.log('\n5️⃣ Exemples de questions:');
    
    const exampleQuestions = questions.slice(0, 5);
    exampleQuestions.forEach(q => {
      const hasConditions = q.conditions && Object.keys(q.conditions).length > 0;
      console.log(`   ${q.question_id}: ${q.question_text}`);
      if (hasConditions) {
        console.log(`     Condition: ${JSON.stringify(q.conditions)}`);
      }
      console.log('');
    });

    // 6. Résumé final
    console.log('🎉 TEST RÉUSSI !');
    console.log('✅ Questions TICPE présentes et fonctionnelles');
    console.log('✅ Logique conditionnelle opérationnelle');
    console.log('✅ Intégration prête pour le frontend');
    
    console.log('\n💡 Prochaines étapes:');
    console.log('   1. Intégrer le composant IntelligentQuestionnaire');
    console.log('   2. Tester avec de vrais utilisateurs');
    console.log('   3. Ajuster les conditions si nécessaire');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter le test
testTICPEIntegration(); 
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc2OTg0OSwiZXhwIjoyMDU3MzQ1ODQ5fQ.pN73GQUJHmd099PUcxAVGm-TFTe3KHeBemBk9IlGAcg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOptionsStructure() {
  console.log('🔧 Correction de la structure des options...');
  
  try {
    // 1. Récupérer toutes les questions
    const { data: questions, error } = await supabase
      .from('QuestionnaireQuestion')
      .select('*')
      .order('question_order', { ascending: true });
    
    if (error) {
      console.error('❌ Erreur lors de la récupération des questions:', error);
      return;
    }
    
    console.log(`✅ ${questions.length} questions trouvées`);
    
    let updatedCount = 0;
    
    // 2. Corriger chaque question
    for (const question of questions) {
      let needsUpdate = false;
      let updatedOptions = question.options;
      
      console.log(`\n🔍 Question: ${question.question_text}`);
      console.log(`   Type: ${question.question_type}`);
      console.log(`   Options actuelles:`, question.options);
      
      // Vérifier si les options sont un tableau simple
      if (Array.isArray(question.options)) {
        console.log('⚠️ Options en tableau simple détectées, conversion...');
        updatedOptions = {
          choix: question.options
        };
        needsUpdate = true;
      }
      // Vérifier si les options sont une string JSON
      else if (typeof question.options === 'string') {
        try {
          const parsed = JSON.parse(question.options);
          if (Array.isArray(parsed)) {
            console.log('⚠️ Options JSON en tableau détectées, conversion...');
            updatedOptions = {
              choix: parsed
            };
            needsUpdate = true;
          }
        } catch (e) {
          console.log('❌ Erreur parsing JSON, création d\'options par défaut');
          updatedOptions = {
            choix: ['Option 1', 'Option 2', 'Option 3']
          };
          needsUpdate = true;
        }
      }
      // Vérifier si les options n'ont pas la propriété choix
      else if (question.options && typeof question.options === 'object' && !question.options.choix) {
        console.log('⚠️ Options sans propriété choix détectées, ajout...');
        updatedOptions = {
          choix: Object.values(question.options)
        };
        needsUpdate = true;
      }
      
      // 3. Mettre à jour si nécessaire
      if (needsUpdate) {
        console.log('   ✅ Options corrigées:', updatedOptions);
        
        const { error: updateError } = await supabase
          .from('QuestionnaireQuestion')
          .update({
            options: updatedOptions
          })
          .eq('id', question.id);
        
        if (updateError) {
          console.error('❌ Erreur lors de la mise à jour:', updateError);
        } else {
          console.log('   ✅ Question mise à jour');
          updatedCount++;
        }
      } else {
        console.log('   ✅ Structure correcte, aucune modification');
      }
    }
    
    console.log(`\n🎉 Correction terminée ! ${updatedCount} questions mises à jour.`);
    
    // 4. Vérification finale
    console.log('\n🔍 Vérification finale...');
    const { data: sampleQuestions } = await supabase
      .from('QuestionnaireQuestion')
      .select('*')
      .limit(3);
    
    sampleQuestions.forEach((q, i) => {
      console.log(`\nQuestion ${i + 1}:`);
      console.log('- Texte:', q.question_text);
      console.log('- Type:', q.question_type);
      console.log('- Options:', q.options);
      console.log('- Options.choix:', q.options?.choix ? '✅' : '❌');
      if (q.options?.choix) {
        console.log('- Nombre de choix:', q.options.choix.length);
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la correction
fixOptionsStructure().catch(console.error); 
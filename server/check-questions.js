const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 Vérification des variables d\'environnement...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Défini' : '❌ Manquant');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Défini' : '❌ Manquant');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkQuestions() {
  console.log('\n🔍 Vérification des questions du simulateur...');
  
  try {
    const { data, error } = await supabase
      .from('QuestionnaireQuestion')
      .select('*')
      .order('question_order', { ascending: true });
    
    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }
    
    console.log(`✅ ${data.length} questions trouvées`);
    
    if (data.length > 0) {
      console.log('\n📋 Première question:');
      console.log(JSON.stringify(data[0], null, 2));
      
      console.log('\n🔍 Vérification de la structure des options:');
      data.slice(0, 3).forEach((q, i) => {
        console.log(`\nQuestion ${i + 1}:`);
        console.log('- ID:', q.id);
        console.log('- Texte:', q.question_text);
        console.log('- Type:', q.question_type);
        console.log('- Options:', q.options);
        console.log('- Options type:', typeof q.options);
        if (q.options) {
          try {
            const parsed = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
            console.log('- Options parsées:', parsed);
            if (parsed.choix) {
              console.log('- Choix disponibles:', parsed.choix);
            }
          } catch (e) {
            console.log('- Erreur parsing options:', e.message);
          }
        }
      });
    } else {
      console.log('❌ Aucune question trouvée dans la base de données');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkQuestions().catch(console.error); 
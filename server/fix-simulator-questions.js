const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase (à adapter selon votre configuration)
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixQuestions() {
  console.log('🔍 Vérification et correction des questions du simulateur...');
  
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
    
    // 2. Vérifier et corriger chaque question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`\n🔍 Question ${i + 1}: ${question.question_text}`);
      
      let needsUpdate = false;
      let updatedQuestion = { ...question };
      
      // Vérifier le type de question
      if (!question.question_type) {
        console.log('⚠️ Type de question manquant, définition automatique...');
        updatedQuestion.question_type = 'choix_unique';
        needsUpdate = true;
      }
      
      // Vérifier et corriger les options
      if (question.options) {
        let options = question.options;
        
        // Si options est une string, essayer de la parser
        if (typeof options === 'string') {
          try {
            options = JSON.parse(options);
            console.log('✅ Options parsées depuis string');
          } catch (e) {
            console.log('❌ Erreur parsing options, création d\'options par défaut');
            options = { choix: ['Option 1', 'Option 2', 'Option 3'] };
            needsUpdate = true;
          }
        }
        
        // Vérifier que les options ont la structure attendue
        if (!options.choix || !Array.isArray(options.choix)) {
          console.log('⚠️ Structure options incorrecte, correction...');
          
          // Créer des options par défaut selon le type de question
          if (question.question_type === 'choix_unique') {
            options = {
              choix: [
                'Transport routier',
                'Transport maritime',
                'Transport aérien',
                'Autre'
              ]
            };
          } else if (question.question_type === 'choix_multiple') {
            options = {
              choix: [
                'Option 1',
                'Option 2', 
                'Option 3',
                'Option 4'
              ]
            };
          } else if (question.question_type === 'nombre') {
            options = {
              placeholder: 'Entrez un nombre',
              min: 0,
              max: 1000000,
              unite: '€'
            };
          } else if (question.question_type === 'texte') {
            options = {
              placeholder: 'Entrez votre réponse'
            };
          }
          
          needsUpdate = true;
        }
        
        updatedQuestion.options = options;
      } else {
        console.log('⚠️ Options manquantes, création d\'options par défaut...');
        updatedQuestion.options = {
          choix: ['Option 1', 'Option 2', 'Option 3']
        };
        needsUpdate = true;
      }
      
      // 3. Mettre à jour la question si nécessaire
      if (needsUpdate) {
        console.log('🔄 Mise à jour de la question...');
        
        const { error: updateError } = await supabase
          .from('QuestionnaireQuestion')
          .update(updatedQuestion)
          .eq('id', question.id);
        
        if (updateError) {
          console.error('❌ Erreur lors de la mise à jour:', updateError);
        } else {
          console.log('✅ Question mise à jour avec succès');
        }
      } else {
        console.log('✅ Question correcte, aucune modification nécessaire');
      }
    }
    
    console.log('\n🎉 Vérification terminée !');
    
    // 4. Afficher un exemple de question corrigée
    const { data: sampleQuestion } = await supabase
      .from('QuestionnaireQuestion')
      .select('*')
      .limit(1)
      .single();
    
    if (sampleQuestion) {
      console.log('\n📋 Exemple de question après correction:');
      console.log(JSON.stringify(sampleQuestion, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Questions par défaut si la table est vide
const defaultQuestions = [
  {
    question_order: 1,
    question_text: "Dans quel secteur d'activité exercez-vous principalement ?",
    question_type: "choix_unique",
    options: {
      choix: [
        "Transport routier",
        "Transport maritime", 
        "Transport aérien",
        "Commerce",
        "Industrie",
        "Services",
        "Construction",
        "Agriculture",
        "Autre"
      ]
    },
    validation_rules: {},
    importance: 5,
    conditions: {},
    produits_cibles: ["TICPE", "URSSAF"],
    phase: 1
  },
  {
    question_order: 2,
    question_text: "Quel est votre chiffre d'affaires annuel ?",
    question_type: "choix_unique",
    options: {
      choix: [
        "Moins de 100 000€",
        "100 000€ - 500 000€",
        "500 000€ - 1 000 000€",
        "1 000 000€ - 5 000 000€",
        "Plus de 5 000 000€"
      ]
    },
    validation_rules: {},
    importance: 4,
    conditions: {},
    produits_cibles: ["TICPE", "URSSAF", "DFS"],
    phase: 1
  },
  {
    question_order: 3,
    question_text: "Combien de véhicules utilisez-vous pour votre activité ?",
    question_type: "nombre",
    options: {
      placeholder: "Nombre de véhicules",
      min: 0,
      max: 1000,
      unite: "véhicules"
    },
    validation_rules: {},
    importance: 3,
    conditions: {},
    produits_cibles: ["TICPE"],
    phase: 1
  }
];

async function createDefaultQuestions() {
  console.log('📝 Création des questions par défaut...');
  
  try {
    const { error } = await supabase
      .from('QuestionnaireQuestion')
      .insert(defaultQuestions);
    
    if (error) {
      console.error('❌ Erreur lors de la création des questions:', error);
    } else {
      console.log('✅ Questions par défaut créées avec succès');
    }
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter les fonctions
async function main() {
  console.log('🚀 Démarrage de la vérification du simulateur...\n');
  
  // Vérifier si des questions existent
  const { data: existingQuestions } = await supabase
    .from('QuestionnaireQuestion')
    .select('count')
    .limit(1);
  
  if (!existingQuestions || existingQuestions.length === 0) {
    console.log('📝 Aucune question trouvée, création des questions par défaut...');
    await createDefaultQuestions();
  }
  
  await checkAndFixQuestions();
}

main().catch(console.error); 
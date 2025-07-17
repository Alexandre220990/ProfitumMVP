// Script simple pour corriger les questions du simulateur
// À exécuter dans la console du navigateur sur la page du simulateur

console.log('🔧 Correction des questions du simulateur...');

// Fonction pour corriger les options d'une question
function fixQuestionOptions(question) {
  if (!question.options) {
    console.log('⚠️ Options manquantes pour:', question.question_text);
    return {
      ...question,
      options: {
        choix: ['Option 1', 'Option 2', 'Option 3']
      }
    };
  }
  
  // Si options est une string, essayer de la parser
  if (typeof question.options === 'string') {
    try {
      const parsed = JSON.parse(question.options);
      console.log('✅ Options parsées pour:', question.question_text);
      return {
        ...question,
        options: parsed
      };
    } catch (e) {
      console.log('❌ Erreur parsing pour:', question.question_text);
      return {
        ...question,
        options: {
          choix: ['Option 1', 'Option 2', 'Option 3']
        }
      };
    }
  }
  
  // Si options n'a pas de propriété choix
  if (!question.options.choix) {
    console.log('⚠️ Propriété choix manquante pour:', question.question_text);
    return {
      ...question,
      options: {
        ...question.options,
        choix: ['Option 1', 'Option 2', 'Option 3']
      }
    };
  }
  
  return question;
}

// Fonction pour corriger toutes les questions
function fixAllQuestions(questions) {
  return questions.map(fixQuestionOptions);
}

// Exporter les fonctions pour utilisation
window.simulatorFix = {
  fixQuestionOptions,
  fixAllQuestions
};

console.log('✅ Script de correction chargé. Utilisez:');
console.log('- window.simulatorFix.fixQuestionOptions(question)');
console.log('- window.simulatorFix.fixAllQuestions(questions)'); 
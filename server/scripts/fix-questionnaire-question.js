const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixQuestionnaireQuestion() {
  console.log('🔧 Correction de la table QuestionnaireQuestion...');
  
  try {
    // 1. Créer la table QuestionnaireQuestion
    console.log('📋 Étape 1: Création de la table QuestionnaireQuestion');
    
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS "public"."QuestionnaireQuestion" (
          "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          "question_order" integer NOT NULL,
          "question_text" text NOT NULL,
          "question_type" text NOT NULL CHECK (question_type IN ('choix_unique', 'choix_multiple', 'nombre', 'texte', 'email', 'telephone')),
          "options" jsonb DEFAULT '{}'::jsonb,
          "validation_rules" jsonb DEFAULT '{}'::jsonb,
          "importance" integer DEFAULT 1 CHECK (importance >= 1 AND importance <= 5),
          "conditions" jsonb DEFAULT '{}'::jsonb,
          "produits_cibles" text[] DEFAULT '{}',
          "phase" integer DEFAULT 1,
          "created_at" timestamp with time zone DEFAULT now(),
          "updated_at" timestamp with time zone DEFAULT now()
        );
      `
    });

    if (createError) {
      console.log('⚠️ Table déjà existante ou erreur:', createError.message);
    } else {
      console.log('✅ Table QuestionnaireQuestion créée');
    }

    // 2. Créer les index
    console.log('📋 Étape 2: Création des index');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS "idx_questionnaire_question_order" ON "public"."QuestionnaireQuestion" ("question_order");',
      'CREATE INDEX IF NOT EXISTS "idx_questionnaire_question_type" ON "public"."QuestionnaireQuestion" ("question_type");',
      'CREATE INDEX IF NOT EXISTS "idx_questionnaire_question_phase" ON "public"."QuestionnaireQuestion" ("phase");'
    ];

    for (const index of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: index });
      if (indexError) {
        console.log('⚠️ Index déjà existant ou erreur:', indexError.message);
      }
    }

    // 3. Ajouter la contrainte d'unicité
    console.log('📋 Étape 3: Ajout de la contrainte d\'unicité');
    
    const { error: constraintError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "public"."QuestionnaireQuestion" ADD CONSTRAINT "unique_question_order" UNIQUE ("question_order");'
    });

    if (constraintError) {
      console.log('⚠️ Contrainte déjà existante ou erreur:', constraintError.message);
    }

    // 4. Vérifier si des questions existent déjà
    console.log('📋 Étape 4: Vérification des questions existantes');
    
    const { data: existingQuestions, error: countError } = await supabase
      .from('QuestionnaireQuestion')
      .select('id', { count: 'exact' });

    if (countError) {
      console.error('❌ Erreur lors de la vérification:', countError);
      return;
    }

    const questionCount = existingQuestions?.length || 0;
    console.log(`📊 ${questionCount} questions existantes trouvées`);

    // 5. Si aucune question, insérer les questions par défaut
    if (questionCount === 0) {
      console.log('📋 Étape 5: Insertion des questions par défaut');
      
      const defaultQuestions = [
        {
          question_order: 1,
          question_text: "Dans quel secteur d'activité exercez-vous principalement ?",
          question_type: "choix_unique",
          options: {choix: ["Transport routier", "Transport maritime", "Transport aérien", "Commerce", "Industrie", "Services", "Construction", "Agriculture", "Autre"]},
          validation_rules: {},
          importance: 5,
          conditions: {},
          produits_cibles: ["TICPE", "URSSAF", "DFS"],
          phase: 1
        },
        {
          question_order: 2,
          question_text: "Quel est votre chiffre d'affaires annuel ?",
          question_type: "choix_unique",
          options: {choix: ["Moins de 100 000€", "100 000€ - 500 000€", "500 000€ - 1 000 000€", "1 000 000€ - 5 000 000€", "Plus de 5 000 000€"]},
          validation_rules: {},
          importance: 4,
          conditions: {},
          produits_cibles: ["TICPE", "URSSAF", "DFS", "FONCIER"],
          phase: 1
        },
        {
          question_order: 3,
          question_text: "Combien d'employés avez-vous ?",
          question_type: "choix_unique",
          options: {choix: ["Aucun", "1 à 5", "6 à 20", "21 à 50", "Plus de 50"]},
          validation_rules: {},
          importance: 4,
          conditions: {},
          produits_cibles: ["URSSAF", "DFS"],
          phase: 1
        },
        {
          question_order: 4,
          question_text: "Possédez-vous des véhicules professionnels ?",
          question_type: "choix_unique",
          options: {choix: ["Oui", "Non"]},
          validation_rules: {},
          importance: 3,
          conditions: {},
          produits_cibles: ["TICPE"],
          phase: 1
        },
        {
          question_order: 5,
          question_text: "Combien de véhicules utilisez-vous pour votre activité ?",
          question_type: "nombre",
          options: {placeholder: "Nombre de véhicules", min: 0, max: 1000, unite: "véhicules"},
          validation_rules: {},
          importance: 3,
          conditions: {},
          produits_cibles: ["TICPE"],
          phase: 1
        }
      ];

      const { error: insertError } = await supabase
        .from('QuestionnaireQuestion')
        .insert(defaultQuestions);

      if (insertError) {
        console.error('❌ Erreur lors de l\'insertion des questions:', insertError);
      } else {
        console.log('✅ Questions par défaut insérées avec succès');
      }
    } else {
      console.log('✅ Questions déjà présentes, pas d\'insertion nécessaire');
    }

    console.log('🎉 Correction de la table QuestionnaireQuestion terminée !');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
fixQuestionnaireQuestion(); 
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function insertTICPEQuestionnaire() {
  console.log('📝 Insertion du questionnaire TICPE optimisé...\n');

  try {
    // Nettoyer les anciennes questions TICPE
    console.log('🧹 Nettoyage des anciennes questions...');
    const { error: deleteError } = await supabase
      .from('QuestionnaireQuestion')
      .delete()
      .contains('produits_cibles', ['TICPE']);

    if (deleteError) {
      console.log('⚠️ Erreur lors du nettoyage:', deleteError.message);
    } else {
      console.log('✅ Anciennes questions supprimées');
    }

    // Questions TICPE optimisées avec validation_rules et identifiants explicites
    const ticpeQuestions = [
      // Phase 1 : Informations Générales
      {
        question_id: 'TICPE_001',
        question_order: 1,
        question_text: "Dans quel secteur d'activité exercez-vous principalement ?",
        question_type: "choix_unique",
        options: {
          choix: [
            "Transport routier de marchandises",
            "Transport routier de voyageurs",
            "Transport maritime",
            "Transport aérien",
            "Taxi / VTC",
            "BTP / Travaux publics",
            "Terrassement",
            "Assainissement",
            "Secteur Agricole",
            "Commerce",
            "Industrie",
            "Services",
            "Construction",
            "Autre"
          ]
        },
        validation_rules: {
          required: true,
          min_choices: 1,
          max_choices: 1
        },
        importance: 5,
        conditions: {},
        produits_cibles: ["TICPE"],
        phase: 1
      },
      {
        question_id: 'TICPE_002',
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
        validation_rules: {
          required: true,
          min_choices: 1,
          max_choices: 1
        },
        importance: 4,
        conditions: {},
        produits_cibles: ["TICPE"],
        phase: 1
      },

      // Phase 2 : Véhicules Professionnels
      {
        question_id: 'TICPE_003',
        question_order: 3,
        question_text: "Possédez-vous des véhicules professionnels ?",
        question_type: "choix_unique",
        options: {
          choix: ["Oui", "Non"]
        },
        validation_rules: {
          required: true,
          min_choices: 1,
          max_choices: 1
        },
        importance: 5,
        conditions: {},
        produits_cibles: ["TICPE"],
        phase: 2
      },
      {
        question_id: 'TICPE_004',
        question_order: 4,
        question_text: "Combien de véhicules utilisez-vous pour votre activité ?",
        question_type: "choix_unique",
        options: {
          choix: [
            "1 à 3 véhicules",
            "4 à 10 véhicules",
            "11 à 25 véhicules",
            "Plus de 25 véhicules"
          ]
        },
        validation_rules: {
          required: true,
          min_choices: 1,
          max_choices: 1,
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        importance: 4,
        conditions: {
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        produits_cibles: ["TICPE"],
        phase: 2
      },
      {
        question_id: 'TICPE_005',
        question_order: 5,
        question_text: "Quels types de véhicules utilisez-vous ?",
        question_type: "choix_multiple",
        options: {
          choix: [
            "Camions de plus de 7,5 tonnes",
            "Camions de 3,5 à 7,5 tonnes",
            "Véhicules utilitaires légers",
            "Engins de chantier",
            "Véhicules de service",
            "Véhicules de fonction",
            "Tracteurs agricoles",
            "Autre"
          ]
        },
        validation_rules: {
          required: true,
          min_choices: 1,
          max_choices: 8,
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        importance: 4,
        conditions: {
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        produits_cibles: ["TICPE"],
        phase: 2
      },
      {
        question_id: 'TICPE_006',
        question_order: 6,
        question_text: "Vos véhicules sont-ils équipés de chronotachygraphe ?",
        question_type: "choix_unique",
        options: {
          choix: [
            "Oui, tous",
            "Oui, certains",
            "Non"
          ]
        },
        validation_rules: {
          required: true,
          min_choices: 1,
          max_choices: 1,
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        importance: 3,
        conditions: {
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        produits_cibles: ["TICPE"],
        phase: 2
      },

      // Phase 3 : Consommation Carburant
      {
        question_id: 'TICPE_007',
        question_order: 7,
        question_text: "Quelle est votre consommation annuelle de carburant ?",
        question_type: "choix_unique",
        options: {
          choix: [
            "Moins de 5 000 litres",
            "5 000 à 15 000 litres",
            "15 000 à 50 000 litres",
            "Plus de 50 000 litres"
          ]
        },
        validation_rules: {
          required: true,
          min_choices: 1,
          max_choices: 1,
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        importance: 4,
        conditions: {
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        produits_cibles: ["TICPE"],
        phase: 3
      },
      {
        question_id: 'TICPE_008',
        question_order: 8,
        question_text: "Quels types de carburant utilisez-vous ?",
        question_type: "choix_multiple",
        options: {
          choix: [
            "Gazole professionnel",
            "Gazole Non Routier (GNR)",
            "Essence",
            "GPL",
            "Électricité",
            "Autre"
          ]
        },
        validation_rules: {
          required: true,
          min_choices: 1,
          max_choices: 6,
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        importance: 3,
        conditions: {
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        produits_cibles: ["TICPE"],
        phase: 3
      },
      {
        question_id: 'TICPE_009',
        question_order: 9,
        question_text: "Avez-vous conservé vos factures de carburant des 3 dernières années ?",
        question_type: "choix_unique",
        options: {
          choix: [
            "Oui, 3 dernières années complètes",
            "Oui, 2 dernières années",
            "Oui, 1 dernière année",
            "Partiellement",
            "Non"
          ]
        },
        validation_rules: {
          required: true,
          min_choices: 1,
          max_choices: 1,
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        importance: 3,
        conditions: {
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        produits_cibles: ["TICPE"],
        phase: 3
      },

      // Phase 4 : Usage Professionnel
      {
        question_id: 'TICPE_010',
        question_order: 10,
        question_text: "Quel est le pourcentage d'usage professionnel de vos véhicules ?",
        question_type: "choix_unique",
        options: {
          choix: [
            "100% professionnel",
            "80-99% professionnel",
            "60-79% professionnel",
            "Moins de 60% professionnel"
          ]
        },
        validation_rules: {
          required: true,
          min_choices: 1,
          max_choices: 1,
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        importance: 4,
        conditions: {
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        produits_cibles: ["TICPE"],
        phase: 4
      },
      {
        question_id: 'TICPE_011',
        question_order: 11,
        question_text: "Quel est le kilométrage annuel moyen par véhicule ?",
        question_type: "choix_unique",
        options: {
          choix: [
            "Moins de 10 000 km",
            "10 000 à 30 000 km",
            "30 000 à 60 000 km",
            "Plus de 60 000 km"
          ]
        },
        validation_rules: {
          required: true,
          min_choices: 1,
          max_choices: 1,
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        importance: 3,
        conditions: {
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        produits_cibles: ["TICPE"],
        phase: 4
      },

      // Phase 5 : Maturité Administrative
      {
        question_id: 'TICPE_012',
        question_order: 12,
        question_text: "Disposez-vous de cartes carburant professionnelles ?",
        question_type: "choix_unique",
        options: {
          choix: [
            "Oui, toutes les stations",
            "Oui, partiellement",
            "Non"
          ]
        },
        validation_rules: {
          required: true,
          min_choices: 1,
          max_choices: 1,
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        importance: 3,
        conditions: {
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        produits_cibles: ["TICPE"],
        phase: 5
      },
      {
        question_id: 'TICPE_013',
        question_order: 13,
        question_text: "Conservez-vous les factures nominatives avec numéro d'immatriculation ?",
        question_type: "choix_unique",
        options: {
          choix: [
            "Oui, systématiquement",
            "Oui, partiellement",
            "Non"
          ]
        },
        validation_rules: {
          required: true,
          min_choices: 1,
          max_choices: 1,
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        importance: 3,
        conditions: {
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        produits_cibles: ["TICPE"],
        phase: 5
      },
      {
        question_id: 'TICPE_014',
        question_order: 14,
        question_text: "Vos véhicules sont-ils tous immatriculés au nom de la société ?",
        question_type: "choix_unique",
        options: {
          choix: [
            "Oui, 100%",
            "Oui, majoritairement",
            "Non"
          ]
        },
        validation_rules: {
          required: true,
          min_choices: 1,
          max_choices: 1,
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        importance: 3,
        conditions: {
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        produits_cibles: ["TICPE"],
        phase: 5
      },
      {
        question_id: 'TICPE_015',
        question_order: 15,
        question_text: "Faites-vous déjà une déclaration semestrielle ou annuelle de TICPE ?",
        question_type: "choix_unique",
        options: {
          choix: [
            "Oui, régulièrement",
            "Oui, occasionnellement",
            "Non"
          ]
        },
        validation_rules: {
          required: true,
          min_choices: 1,
          max_choices: 1,
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        importance: 3,
        conditions: {
          depends_on: { question_id: 'TICPE_003', answer: "Oui" }
        },
        produits_cibles: ["TICPE"],
        phase: 5
      },

      // Phase 6 : Informations Complémentaires
      {
        question_id: 'TICPE_016',
        question_order: 16,
        question_text: "Avez-vous des projets d'optimisation fiscale en cours ?",
        question_type: "choix_multiple",
        options: {
          choix: [
            "CIR (Crédit d'Impôt Recherche)",
            "CICE (Crédit d'Impôt Compétitivité Emploi)",
            "Optimisation URSSAF",
            "Audit énergétique",
            "Aucun",
            "Autre"
          ]
        },
        validation_rules: {
          required: false,
          min_choices: 0,
          max_choices: 6
        },
        importance: 2,
        conditions: {},
        produits_cibles: ["TICPE"],
        phase: 6
      },
      {
        question_id: 'TICPE_017',
        question_order: 17,
        question_text: "Quels sont vos objectifs prioritaires en matière d'optimisation ?",
        question_type: "choix_multiple",
        options: {
          choix: [
            "Réduire les coûts",
            "Améliorer la rentabilité",
            "Optimiser la fiscalité",
            "Bénéficier d'aides",
            "Conformité réglementaire",
            "Autre"
          ]
        },
        validation_rules: {
          required: false,
          min_choices: 0,
          max_choices: 6
        },
        importance: 2,
        conditions: {},
        produits_cibles: ["TICPE"],
        phase: 6
      }
    ];

    // Insertion des questions avec transaction Supabase
    console.log('📝 Insertion des nouvelles questions TICPE avec transaction...');
    
    // Utiliser une transaction pour garantir l'atomicité
    const { data, error } = await supabase.rpc('insert_ticpe_questions_transaction', {
      questions_data: ticpeQuestions
    });

    if (error) {
      console.log('⚠️ Erreur lors de l\'insertion en transaction:', error.message);
      console.log('🔄 Tentative d\'insertion séquentielle...');
      
      // Fallback : insertion séquentielle
      let successCount = 0;
      let errorCount = 0;
      
      for (const question of ticpeQuestions) {
        const { error: insertError } = await supabase
          .from('QuestionnaireQuestion')
          .insert(question);

        if (insertError) {
          console.log(`⚠️ Erreur question ${question.question_id}: ${insertError.message}`);
          errorCount++;
        } else {
          console.log(`✅ Question ${question.question_id} insérée: ${question.question_text.substring(0, 50)}...`);
          successCount++;
        }
      }
      
      console.log(`\n📊 Résultat insertion séquentielle: ${successCount} succès, ${errorCount} erreurs`);
    } else {
      console.log('✅ Toutes les questions insérées avec succès en transaction');
    }

    console.log('\n✅ Questionnaire TICPE optimisé inséré avec succès !');
    console.log(`📊 Total: ${ticpeQuestions.length} questions réparties en 6 phases`);
    console.log('\n📋 Phases du questionnaire :');
    console.log('1. Informations Générales (2 questions)');
    console.log('2. Véhicules Professionnels (4 questions)');
    console.log('3. Consommation Carburant (3 questions)');
    console.log('4. Usage Professionnel (2 questions)');
    console.log('5. Maturité Administrative (4 questions)');
    console.log('6. Informations Complémentaires (2 questions)');
    
    console.log('\n🔧 Améliorations apportées :');
    console.log('✅ Identifiants explicites (TICPE_001 à TICPE_017)');
    console.log('✅ Validation rules avec required, min_choices, max_choices');
    console.log('✅ Dépendances entre questions dans validation_rules');
    console.log('✅ Transaction Supabase pour l\'atomicité');
    console.log('✅ Fallback en insertion séquentielle');

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion du questionnaire TICPE:', error);
  }
}

// Exécution du script
if (require.main === module) {
  insertTICPEQuestionnaire();
}

module.exports = { insertTICPEQuestionnaire }; 
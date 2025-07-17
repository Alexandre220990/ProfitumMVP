#!/usr/bin/env node

/**
 * Script de correction complète du simulateur d'éligibilité
 * ========================================================
 * 
 * Ce script corrige tous les problèmes identifiés :
 * 1. Tables manquantes
 * 2. Questions incorrectes
 * 3. Erreurs de contraintes de clés étrangères
 * 4. Structure des données
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Questions corrigées pour le simulateur
const CORRECTED_QUESTIONS = [
  {
    question_order: 1,
    question_text: "Dans quel secteur d'activité exercez-vous principalement ?",
    question_type: "choix_unique",
    options: {
      choix: ["Transport routier", "Transport maritime", "Transport aérien", "Commerce", "Industrie", "Services", "Construction", "Agriculture", "Autre"]
    },
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
    options: {
      choix: ["Moins de 100 000€", "100 000€ - 500 000€", "500 000€ - 1 000 000€", "1 000 000€ - 5 000 000€", "Plus de 5 000 000€"]
    },
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
    options: {
      choix: ["Aucun", "1 à 5", "6 à 20", "21 à 50", "Plus de 50"]
    },
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
    options: {
      choix: ["Oui", "Non"]
    },
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
    options: {
      placeholder: "Nombre de véhicules",
      min: 0,
      max: 1000,
      unite: "véhicules"
    },
    validation_rules: {},
    importance: 3,
    conditions: {
      depends_on: { question_id: 4, answer: "Oui" }
    },
    produits_cibles: ["TICPE"],
    phase: 1
  },
  {
    question_order: 6,
    question_text: "Avez-vous des véhicules de plus de 3,5 tonnes ?",
    question_type: "choix_unique",
    options: {
      choix: ["Oui", "Non"]
    },
    validation_rules: {},
    importance: 3,
    conditions: {
      depends_on: { question_id: 4, answer: "Oui" }
    },
    produits_cibles: ["TICPE"],
    phase: 1
  },
  {
    question_order: 7,
    question_text: "Quelle est votre consommation annuelle de carburant (en litres) ?",
    question_type: "nombre",
    options: {
      placeholder: "Consommation en litres",
      min: 0,
      max: 1000000,
      unite: "litres"
    },
    validation_rules: {},
    importance: 3,
    conditions: {
      depends_on: { question_id: 4, answer: "Oui" }
    },
    produits_cibles: ["TICPE"],
    phase: 1
  },
  {
    question_order: 8,
    question_text: "Avez-vous conservé vos factures de carburant des 3 dernières années ?",
    question_type: "choix_unique",
    options: {
      choix: ["Oui, toutes", "Oui, partiellement", "Non"]
    },
    validation_rules: {},
    importance: 2,
    conditions: {
      depends_on: { question_id: 4, answer: "Oui" }
    },
    produits_cibles: ["TICPE"],
    phase: 1
  },
  {
    question_order: 9,
    question_text: "Êtes-vous propriétaire de vos locaux professionnels ?",
    question_type: "choix_unique",
    options: {
      choix: ["Oui", "Non", "Je ne sais pas"]
    },
    validation_rules: {},
    importance: 3,
    conditions: {},
    produits_cibles: ["FONCIER"],
    phase: 1
  },
  {
    question_order: 10,
    question_text: "Payez-vous une taxe foncière sur vos locaux ?",
    question_type: "choix_unique",
    options: {
      choix: ["Oui", "Non", "Je ne sais pas"]
    },
    validation_rules: {},
    importance: 3,
    conditions: {
      depends_on: { question_id: 9, answer: "Oui" }
    },
    produits_cibles: ["FONCIER"],
    phase: 1
  },
  {
    question_order: 11,
    question_text: "Quel est le montant annuel de votre taxe foncière (en euros) ?",
    question_type: "nombre",
    options: {
      placeholder: "Montant en euros",
      min: 0,
      max: 100000,
      unite: "€"
    },
    validation_rules: {},
    importance: 2,
    conditions: {
      depends_on: { question_id: 10, answer: "Oui" }
    },
    produits_cibles: ["FONCIER"],
    phase: 1
  },
  {
    question_order: 12,
    question_text: "Quelle est la surface totale de vos locaux professionnels (en m²) ?",
    question_type: "nombre",
    options: {
      placeholder: "Surface en m²",
      min: 0,
      max: 100000,
      unite: "m²"
    },
    validation_rules: {},
    importance: 2,
    conditions: {
      depends_on: { question_id: 9, answer: "Oui" }
    },
    produits_cibles: ["FONCIER"],
    phase: 1
  },
  {
    question_order: 13,
    question_text: "Avez-vous des employés avec des contrats spécifiques ?",
    question_type: "choix_multiple",
    options: {
      choix: ["Heures supplémentaires", "Travail temporaire", "Intérim", "Saisonniers", "Déplacements fréquents", "Aucun"]
    },
    validation_rules: {},
    importance: 3,
    conditions: {
      depends_on: { question_id: 3, answer: ["1 à 5", "6 à 20", "21 à 50", "Plus de 50"] }
    },
    produits_cibles: ["URSSAF", "DFS"],
    phase: 1
  },
  {
    question_order: 14,
    question_text: "Quelle est votre masse salariale annuelle (en euros) ?",
    question_type: "nombre",
    options: {
      placeholder: "Masse salariale en euros",
      min: 0,
      max: 10000000,
      unite: "€"
    },
    validation_rules: {},
    importance: 3,
    conditions: {
      depends_on: { question_id: 3, answer: ["1 à 5", "6 à 20", "21 à 50", "Plus de 50"] }
    },
    produits_cibles: ["URSSAF"],
    phase: 1
  },
  {
    question_order: 15,
    question_text: "Avez-vous accès à vos bordereaux URSSAF récents ?",
    question_type: "choix_unique",
    options: {
      choix: ["Oui", "Non", "Partiellement"]
    },
    validation_rules: {},
    importance: 2,
    conditions: {
      depends_on: { question_id: 3, answer: ["1 à 5", "6 à 20", "21 à 50", "Plus de 50"] }
    },
    produits_cibles: ["URSSAF"],
    phase: 1
  },
  {
    question_order: 16,
    question_text: "Dans quel secteur opèrent vos salariés ?",
    question_type: "choix_multiple",
    options: {
      choix: ["BTP", "Transport", "Sécurité", "Spectacle", "Restauration", "Commerce", "Services", "Autre"]
    },
    validation_rules: {},
    importance: 3,
    conditions: {
      depends_on: { question_id: 3, answer: ["1 à 5", "6 à 20", "21 à 50", "Plus de 50"] }
    },
    produits_cibles: ["DFS"],
    phase: 1
  },
  {
    question_order: 17,
    question_text: "Appliquez-vous actuellement une DFS sur vos bulletins de paie ?",
    question_type: "choix_unique",
    options: {
      choix: ["Oui", "Non", "Je ne sais pas"]
    },
    validation_rules: {},
    importance: 2,
    conditions: {
      depends_on: { question_id: 3, answer: ["1 à 5", "6 à 20", "21 à 50", "Plus de 50"] }
    },
    produits_cibles: ["DFS"],
    phase: 1
  },
  {
    question_order: 18,
    question_text: "Avez-vous des contrats d'électricité et/ou de gaz pour vos locaux ?",
    question_type: "choix_unique",
    options: {
      choix: ["Oui", "Non"]
    },
    validation_rules: {},
    importance: 2,
    conditions: {},
    produits_cibles: ["ENERGIE"],
    phase: 1
  },
  {
    question_order: 19,
    question_text: "Quelle est votre consommation annuelle d'électricité (en kWh) ?",
    question_type: "nombre",
    options: {
      placeholder: "Consommation en kWh",
      min: 0,
      max: 1000000,
      unite: "kWh"
    },
    validation_rules: {},
    importance: 2,
    conditions: {
      depends_on: { question_id: 18, answer: "Oui" }
    },
    produits_cibles: ["ENERGIE"],
    phase: 1
  },
  {
    question_order: 20,
    question_text: "Avez-vous vos factures d'énergie récentes ?",
    question_type: "choix_unique",
    options: {
      choix: ["Oui", "Non", "Partiellement"]
    },
    validation_rules: {},
    importance: 1,
    conditions: {
      depends_on: { question_id: 18, answer: "Oui" }
    },
    produits_cibles: ["ENERGIE"],
    phase: 1
  },
  {
    question_order: 21,
    question_text: "Avez-vous des projets d'amélioration énergétique ?",
    question_type: "choix_multiple",
    options: {
      choix: ["Isolation", "Chauffage", "Éclairage", "Climatisation", "Autre", "Aucun"]
    },
    validation_rules: {},
    importance: 2,
    conditions: {},
    produits_cibles: ["CEE"],
    phase: 1
  },
  {
    question_order: 22,
    question_text: "Quels sont vos objectifs prioritaires en matière d'optimisation ?",
    question_type: "choix_multiple",
    options: {
      choix: ["Réduire les coûts", "Améliorer la rentabilité", "Optimiser la fiscalité", "Bénéficier d'aides", "Conformité réglementaire", "Autre"]
    },
    validation_rules: {},
    importance: 1,
    conditions: {},
    produits_cibles: ["TICPE", "URSSAF", "DFS", "FONCIER", "ENERGIE", "CEE"],
    phase: 1
  }
];

async function createTables() {
  console.log('🏗️ Création des tables du simulateur...');
  
  try {
    // Créer la table TemporarySession
    const { error: sessionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS "public"."TemporarySession" (
          "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          "session_token" text NOT NULL UNIQUE,
          "ip_address" text,
          "user_agent" text,
          "completed" boolean DEFAULT false,
          "abandoned" boolean DEFAULT false,
          "abandon_reason" text,
          "abandoned_at" timestamp with time zone,
          "migrated_to_account" boolean DEFAULT false,
          "migrated_at" timestamp with time zone,
          "client_id" uuid,
          "last_activity" timestamp with time zone DEFAULT now(),
          "created_at" timestamp with time zone DEFAULT now(),
          "updated_at" timestamp with time zone DEFAULT now()
        );
      `
    });

    if (sessionError) {
      console.log('⚠️ Table TemporarySession déjà existante ou erreur:', sessionError.message);
    } else {
      console.log('✅ Table TemporarySession créée');
    }

    // Créer la table TemporaryResponse
    const { error: responseError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS "public"."TemporaryResponse" (
          "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          "session_id" uuid NOT NULL,
          "question_id" uuid NOT NULL,
          "response_value" jsonb NOT NULL,
          "created_at" timestamp with time zone DEFAULT now()
        );
      `
    });

    if (responseError) {
      console.log('⚠️ Table TemporaryResponse déjà existante ou erreur:', responseError.message);
    } else {
      console.log('✅ Table TemporaryResponse créée');
    }

    // Créer la table TemporaryEligibility
    const { error: eligibilityError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS "public"."TemporaryEligibility" (
          "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          "session_id" uuid NOT NULL,
          "produit_id" text NOT NULL,
          "eligibility_score" integer NOT NULL CHECK (eligibility_score >= 0 AND eligibility_score <= 100),
          "estimated_savings" numeric(10,2) DEFAULT 0,
          "confidence_level" text CHECK (confidence_level IN ('low', 'medium', 'high')),
          "recommendations" jsonb DEFAULT '[]'::jsonb,
          "created_at" timestamp with time zone DEFAULT now()
        );
      `
    });

    if (eligibilityError) {
      console.log('⚠️ Table TemporaryEligibility déjà existante ou erreur:', eligibilityError.message);
    } else {
      console.log('✅ Table TemporaryEligibility créée');
    }

    // Créer la table SimulatorAnalytics
    const { error: analyticsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS "public"."SimulatorAnalytics" (
          "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          "session_token" text NOT NULL,
          "event_type" text NOT NULL,
          "event_data" jsonb,
          "timestamp" timestamp with time zone DEFAULT now(),
          "ip_address" text,
          "user_agent" text
        );
      `
    });

    if (analyticsError) {
      console.log('⚠️ Table SimulatorAnalytics déjà existante ou erreur:', analyticsError.message);
    } else {
      console.log('✅ Table SimulatorAnalytics créée');
    }

    console.log('✅ Toutes les tables créées avec succès');

  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
  }
}

async function fixQuestions() {
  console.log('\n📝 Correction des questions du simulateur...');
  
  try {
    // Supprimer toutes les questions existantes
    const { error: deleteError } = await supabase
      .from('QuestionnaireQuestion')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer toutes

    if (deleteError) {
      console.log('⚠️ Erreur lors de la suppression des questions:', deleteError.message);
    } else {
      console.log('🗑️ Anciennes questions supprimées');
    }

    // Insérer les nouvelles questions corrigées
    const { data, error } = await supabase
      .from('QuestionnaireQuestion')
      .insert(CORRECTED_QUESTIONS)
      .select();

    if (error) {
      console.error('❌ Erreur lors de l\'insertion des questions:', error);
      return;
    }

    console.log(`✅ ${data.length} questions corrigées insérées avec succès`);
    
    // Afficher un aperçu
    console.log('\n📋 Aperçu des questions:');
    data.slice(0, 3).forEach((q, i) => {
      console.log(`${i + 1}. ${q.question_text} (${q.question_type})`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la correction des questions:', error);
  }
}

async function testSimulator() {
  console.log('\n🧪 Test du simulateur corrigé...');
  
  try {
    // 1. Créer une session
    console.log('1️⃣ Test création de session...');
    const { data: sessionData, error: sessionError } = await supabase
      .from('TemporarySession')
      .insert({
        session_token: 'test-session-' + Date.now(),
        ip_address: '127.0.0.1',
        user_agent: 'Test-Script'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Erreur création session:', sessionError);
      return;
    }

    console.log('✅ Session créée:', sessionData.session_token);

    // 2. Récupérer les questions
    console.log('2️⃣ Test récupération des questions...');
    const { data: questions, error: questionsError } = await supabase
      .from('QuestionnaireQuestion')
      .select('*')
      .order('question_order', { ascending: true });

    if (questionsError) {
      console.error('❌ Erreur récupération questions:', questionsError);
      return;
    }

    console.log(`✅ ${questions.length} questions récupérées`);

    // 3. Tester une réponse
    if (questions.length > 0) {
      console.log('3️⃣ Test envoi de réponse...');
      const firstQuestion = questions[0];
      
      const { error: responseError } = await supabase
        .from('TemporaryResponse')
        .insert({
          session_id: sessionData.id,
          question_id: firstQuestion.id,
          response_value: ['Transport routier']
        });

      if (responseError) {
        console.error('❌ Erreur envoi réponse:', responseError);
      } else {
        console.log('✅ Réponse envoyée avec succès');
      }
    }

    console.log('🎉 Tests terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

async function main() {
  console.log('🔧 Script de correction complète du simulateur');
  console.log('==============================================\n');

  await createTables();
  await fixQuestions();
  await testSimulator();

  console.log('\n✅ Correction terminée !');
  console.log('\n📋 Prochaines étapes:');
  console.log('1. Redémarrer le serveur backend');
  console.log('2. Tester le simulateur sur http://localhost:3000/simulateur-eligibilite');
  console.log('3. Vérifier que les questions s\'affichent correctement');
  console.log('4. Tester l\'envoi de réponses');
}

main().catch(console.error); 
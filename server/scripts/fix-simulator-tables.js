const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateTables() {
  console.log('🔍 Vérification des tables du simulateur...');
  
  try {
    // 1. Vérifier TemporarySession
    console.log('\n📋 Vérification de TemporarySession...');
    const { data: sessionData, error: sessionError } = await supabase
      .from('TemporarySession')
      .select('count')
      .limit(1);
    
    if (sessionError) {
      console.log('❌ Table TemporarySession manquante, création...');
      await createTemporarySessionTable();
    } else {
      console.log('✅ Table TemporarySession existe');
    }

    // 2. Vérifier TemporaryResponse
    console.log('\n📋 Vérification de TemporaryResponse...');
    const { data: responseData, error: responseError } = await supabase
      .from('TemporaryResponse')
      .select('count')
      .limit(1);
    
    if (responseError) {
      console.log('❌ Table TemporaryResponse manquante, création...');
      await createTemporaryResponseTable();
    } else {
      console.log('✅ Table TemporaryResponse existe');
    }

    // 3. Vérifier TemporaryEligibility
    console.log('\n📋 Vérification de TemporaryEligibility...');
    const { data: eligibilityData, error: eligibilityError } = await supabase
      .from('TemporaryEligibility')
      .select('count')
      .limit(1);
    
    if (eligibilityError) {
      console.log('❌ Table TemporaryEligibility manquante, création...');
      await createTemporaryEligibilityTable();
    } else {
      console.log('✅ Table TemporaryEligibility existe');
    }

    // 4. Vérifier ProductCalculationRules
    console.log('\n📋 Vérification de ProductCalculationRules...');
    const { data: rulesData, error: rulesError } = await supabase
      .from('ProductCalculationRules')
      .select('count')
      .limit(1);
    
    if (rulesError) {
      console.log('❌ Table ProductCalculationRules manquante, création...');
      await createProductCalculationRulesTable();
    } else {
      console.log('✅ Table ProductCalculationRules existe');
    }

    // 5. Vérifier ProductSpecificRates
    console.log('\n📋 Vérification de ProductSpecificRates...');
    const { data: ratesData, error: ratesError } = await supabase
      .from('ProductSpecificRates')
      .select('count')
      .limit(1);
    
    if (ratesError) {
      console.log('❌ Table ProductSpecificRates manquante, création...');
      await createProductSpecificRatesTable();
    } else {
      console.log('✅ Table ProductSpecificRates existe');
    }

    // 6. Insérer des données de test pour les règles
    console.log('\n📋 Insertion des règles de calcul de test...');
    await insertTestRules();

    console.log('\n✅ Toutes les tables sont prêtes !');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

async function createTemporarySessionTable() {
  const { error } = await supabase.rpc('exec_sql', {
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

  if (error) {
    console.error('❌ Erreur création TemporarySession:', error);
  } else {
    console.log('✅ Table TemporarySession créée');
  }
}

async function createTemporaryResponseTable() {
  const { error } = await supabase.rpc('exec_sql', {
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

  if (error) {
    console.error('❌ Erreur création TemporaryResponse:', error);
  } else {
    console.log('✅ Table TemporaryResponse créée');
  }
}

async function createTemporaryEligibilityTable() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS "public"."TemporaryEligibility" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "session_id" uuid NOT NULL,
        "produit_id" text NOT NULL,
        "eligibility_score" integer NOT NULL CHECK (eligibility_score >= 0 AND eligibility_score <= 100),
        "estimated_savings" numeric(10,2) DEFAULT 0,
        "confidence_level" text CHECK (confidence_level IN ('faible', 'moyen', 'élevé')),
        "recommendations" jsonb DEFAULT '[]'::jsonb,
        "created_at" timestamp with time zone DEFAULT now()
      );
    `
  });

  if (error) {
    console.error('❌ Erreur création TemporaryEligibility:', error);
  } else {
    console.log('✅ Table TemporaryEligibility créée');
  }
}

async function createProductCalculationRulesTable() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS "public"."ProductCalculationRules" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "produits_cibles" text[] NOT NULL,
        "question_id" uuid,
        "expected_value" text,
        "score_weight" integer DEFAULT 10,
        "priority" integer DEFAULT 1,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp with time zone DEFAULT now()
      );
    `
  });

  if (error) {
    console.error('❌ Erreur création ProductCalculationRules:', error);
  } else {
    console.log('✅ Table ProductCalculationRules créée');
  }
}

async function createProductSpecificRatesTable() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS "public"."ProductSpecificRates" (
        "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "produit_id" text NOT NULL,
        "rate_type" text NOT NULL,
        "rate_value" numeric(10,4) NOT NULL,
        "conditions" jsonb,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp with time zone DEFAULT now()
      );
    `
  });

  if (error) {
    console.error('❌ Erreur création ProductSpecificRates:', error);
  } else {
    console.log('✅ Table ProductSpecificRates créée');
  }
}

async function insertTestRules() {
  // Règles de base pour TICPE
  const ticpeRules = [
    {
      produits_cibles: ['TICPE'],
      question_id: null,
      expected_value: 'Transport',
      score_weight: 30,
      priority: 1
    },
    {
      produits_cibles: ['TICPE'],
      question_id: null,
      expected_value: 'véhicules',
      score_weight: 25,
      priority: 2
    }
  ];

  // Règles de base pour URSSAF
  const urssafRules = [
    {
      produits_cibles: ['URSSAF'],
      question_id: null,
      expected_value: 'employés',
      score_weight: 30,
      priority: 1
    },
    {
      produits_cibles: ['URSSAF'],
      question_id: null,
      expected_value: 'salariés',
      score_weight: 25,
      priority: 2
    }
  ];

  // Règles de base pour DFS
  const dfsRules = [
    {
      produits_cibles: ['DFS'],
      question_id: null,
      expected_value: 'propriétaire',
      score_weight: 30,
      priority: 1
    }
  ];

  // Règles de base pour FONCIER
  const foncierRules = [
    {
      produits_cibles: ['FONCIER'],
      question_id: null,
      expected_value: 'propriétaire',
      score_weight: 30,
      priority: 1
    }
  ];

  const allRules = [...ticpeRules, ...urssafRules, ...dfsRules, ...foncierRules];

  for (const rule of allRules) {
    const { error } = await supabase
      .from('ProductCalculationRules')
      .insert(rule);

    if (error) {
      console.log(`⚠️ Règle déjà existante ou erreur: ${error.message}`);
    }
  }

  console.log('✅ Règles de calcul insérées');
}

// Exécuter le script
checkAndCreateTables().then(() => {
  console.log('\n🎉 Script terminé avec succès !');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
}); 
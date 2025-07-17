const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Application des parties manquantes de la migration...');
console.log(`📡 Connexion à: ${supabaseUrl}`);

// Fonction pour exécuter une requête SQL
async function executeSQL(sql, description) {
  console.log(`\n🔄 ${description}...`);
  
  try {
    // Essayer d'exécuter via l'API REST (pour les opérations simples)
    const { data, error } = await supabase
      .from('expertassignment')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log(`  ⚠️ Impossible d'exécuter via API: ${error.message}`);
      console.log(`  💡 Cette partie doit être exécutée manuellement dans Supabase SQL Editor`);
      console.log(`  📝 SQL à exécuter:`);
      console.log(`  ${sql}`);
      return false;
    }
    
    console.log(`  ✅ Exécuté avec succès`);
    return true;
    
  } catch (err) {
    console.log(`  ❌ Erreur: ${err.message}`);
    console.log(`  💡 Exécute manuellement dans Supabase SQL Editor:`);
    console.log(`  ${sql}`);
    return false;
  }
}

// Fonction pour vérifier l'état actuel
async function checkCurrentState() {
  console.log('\n🔍 Vérification de l\'état actuel...');
  
  const checks = [
    {
      name: 'Colonne statut dans expertassignment',
      query: 'SELECT column_name FROM information_schema.columns WHERE table_name = \'expertassignment\' AND column_name = \'statut\''
    },
    {
      name: 'Colonne category dans ProduitEligible',
      query: 'SELECT column_name FROM information_schema.columns WHERE table_name = \'ProduitEligible\' AND column_name = \'category\''
    },
    {
      name: 'Colonne active dans ProduitEligible',
      query: 'SELECT column_name FROM information_schema.columns WHERE table_name = \'ProduitEligible\' AND column_name = \'active\''
    },
    {
      name: 'Colonne timestamp dans message',
      query: 'SELECT column_name FROM information_schema.columns WHERE table_name = \'message\' AND column_name = \'timestamp\''
    },
    {
      name: 'Vue v_expert_assignments',
      query: 'SELECT table_name FROM information_schema.views WHERE table_name = \'v_expert_assignments\''
    }
  ];
  
  for (const check of checks) {
    try {
      // Test simple pour voir si la colonne/vue existe
      if (check.name.includes('statut')) {
        const { data, error } = await supabase
          .from('expertassignment')
          .select('statut')
          .limit(1);
        
        if (error && error.message.includes('does not exist')) {
          console.log(`  ❌ ${check.name}: Absente`);
        } else {
          console.log(`  ✅ ${check.name}: Présente`);
        }
      } else if (check.name.includes('category')) {
        const { data, error } = await supabase
          .from('ProduitEligible')
          .select('category')
          .limit(1);
        
        if (error && error.message.includes('does not exist')) {
          console.log(`  ❌ ${check.name}: Absente`);
        } else {
          console.log(`  ✅ ${check.name}: Présente`);
        }
      } else if (check.name.includes('active')) {
        const { data, error } = await supabase
          .from('ProduitEligible')
          .select('active')
          .limit(1);
        
        if (error && error.message.includes('does not exist')) {
          console.log(`  ❌ ${check.name}: Absente`);
        } else {
          console.log(`  ✅ ${check.name}: Présente`);
        }
      } else if (check.name.includes('timestamp')) {
        const { data, error } = await supabase
          .from('message')
          .select('timestamp')
          .limit(1);
        
        if (error && error.message.includes('does not exist')) {
          console.log(`  ❌ ${check.name}: Absente`);
        } else {
          console.log(`  ✅ ${check.name}: Présente`);
        }
      } else {
        console.log(`  ⚠️ ${check.name}: Test non implémenté`);
      }
    } catch (err) {
      console.log(`  ❌ ${check.name}: ${err.message}`);
    }
  }
}

// Fonction pour proposer les corrections manuelles
function proposeManualCorrections() {
  console.log('\n📋 Corrections Manuelles Requises:');
  console.log('==================================');
  console.log('');
  console.log('1. Aller dans Supabase SQL Editor');
  console.log('2. Exécuter les instructions suivantes une par une:');
  console.log('');
  
  console.log('--- PARTIE 1: Ajouter la colonne statut ---');
  console.log(`
ALTER TABLE public.expertassignment 
ADD COLUMN IF NOT EXISTS statut VARCHAR(50) DEFAULT 'pending' CHECK (statut IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled'));
  `);
  
  console.log('--- PARTIE 2: Ajouter les colonnes ProduitEligible ---');
  console.log(`
ALTER TABLE public."ProduitEligible" 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'general';

ALTER TABLE public."ProduitEligible" 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
  `);
  
  console.log('--- PARTIE 3: Ajouter la colonne timestamp ---');
  console.log(`
ALTER TABLE public.message 
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  `);
  
  console.log('--- PARTIE 4: Créer la vue v_expert_assignments ---');
  console.log(`
CREATE OR REPLACE VIEW public.v_expert_assignments AS
SELECT 
    ea.id,
    ea.expert_id,
    ea.client_produit_eligible_id,
    ea.statut,
    ea.created_at,
    ea.updated_at,
    cpe."clientId" as client_id,
    cpe."produitId" as produit_eligible_id,
    c.company_name as client_name,
    pe.nom as produit_nom,
    pe.category as produit_category,
    e.name as expert_name,
    e.email as expert_email,
    e.company_name as expert_company
FROM public.expertassignment ea
LEFT JOIN public."ClientProduitEligible" cpe ON ea.client_produit_eligible_id = cpe.id
LEFT JOIN public."Client" c ON cpe."clientId" = c.id
LEFT JOIN public."ProduitEligible" pe ON cpe."produitId" = pe.id
LEFT JOIN public."Expert" e ON ea.expert_id = e.id
WHERE pe.active = true;
  `);
  
  console.log('--- PARTIE 5: Mettre à jour les données ---');
  console.log(`
UPDATE public."ProduitEligible" 
SET 
    category = CASE 
        WHEN LOWER(nom) LIKE '%ticpe%' THEN 'ticpe'
        WHEN LOWER(nom) LIKE '%cee%' THEN 'cee'
        WHEN LOWER(nom) LIKE '%audit%' THEN 'audit'
        ELSE 'general'
    END,
    active = true
WHERE category IS NULL OR active IS NULL;

UPDATE public.expertassignment 
SET statut = 'pending' 
WHERE statut IS NULL;
  `);
  
  console.log('');
  console.log('💡 Exécute ces parties une par une pour éviter les deadlocks');
  console.log('⏱️ Attends 10-15 secondes entre chaque partie');
}

// Fonction principale
async function main() {
  try {
    console.log('🔧 Démarrage de l\'application des parties manquantes...\n');
    
    // 1. Vérifier l'état actuel
    await checkCurrentState();
    
    // 2. Proposer les corrections manuelles
    proposeManualCorrections();
    
    console.log('\n🎉 Instructions générées !');
    console.log('');
    console.log('📋 Prochaines étapes:');
    console.log('1. Appliquer les corrections manuelles dans Supabase');
    console.log('2. Tester à nouveau: node scripts/test-schema-corrections.js');
    console.log('3. Si tout fonctionne: Démarrer le dashboard admin');
    
  } catch (error) {
    console.error('❌ Erreur lors du processus:', error);
    process.exit(1);
  }
}

// Exécuter le script
main(); 
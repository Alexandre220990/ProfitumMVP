/**
 * Script pour ajouter le statut 'documents_manquants' à la contrainte CHECK
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addStatutConstraint() {
  console.log('🔧 Ajout du statut documents_manquants à la contrainte CHECK...\n');

  try {
    // Supprimer l'ancienne contrainte et en créer une nouvelle
    // Malheureusement, Supabase JS client ne supporte pas les ALTER TABLE directement
    // On doit utiliser le SQL Editor de Supabase ou une connexion PostgreSQL directe

    console.log('⚠️  ATTENTION : Cette opération doit être effectuée via :');
    console.log('   1. Le SQL Editor de Supabase (https://supabase.com/dashboard)');
    console.log('   2. Ou via psql/connection PostgreSQL directe\n');
    
    console.log('📋 SQL à exécuter :');
    console.log('════════════════════════════════════════════════════════\n');
    
    const sql = `
-- Supprimer l'ancienne contrainte
ALTER TABLE "ClientProduitEligible" 
DROP CONSTRAINT IF EXISTS "ClientProduitEligible_statut_check";

-- Recréer la contrainte avec la nouvelle valeur
ALTER TABLE "ClientProduitEligible"
ADD CONSTRAINT "ClientProduitEligible_statut_check" 
CHECK (
    statut IN (
        'eligible',
        'opportunité',
        'documents_uploaded',
        'eligibility_validated',
        'eligibility_rejected',
        'expert_assigned',
        'documents_manquants',  -- ✅ NOUVELLE VALEUR
        'audit_en_cours',
        'audit_termine',
        'audit_rejected_by_client',
        'validated',
        'en_cours',
        'termine',
        'annule',
        'rejete'
    )
);
`;
    
    console.log(sql);
    console.log('════════════════════════════════════════════════════════\n');
    
    console.log('📝 Étapes à suivre :');
    console.log('   1. Copiez le SQL ci-dessus');
    console.log('   2. Allez sur https://supabase.com/dashboard');
    console.log('   3. Sélectionnez votre projet');
    console.log('   4. Allez dans "SQL Editor"');
    console.log('   5. Collez et exécutez le SQL');
    console.log('   6. Relancez le script fix-documents-manquants-retroactif.js\n');

    // Tentative via rpc (peut ne pas fonctionner selon les permissions)
    console.log('🔄 Tentative d\'exécution via RPC...\n');
    
    try {
      // Note : Cette approche ne fonctionnera que si une fonction RPC existe
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: sql
      });
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Contrainte ajoutée via RPC !');
      
    } catch (rpcError) {
      console.log('⚠️  RPC non disponible (normal). Utilisez le SQL Editor manuel.\n');
      console.log('   Erreur RPC:', rpcError.message);
    }

  } catch (error) {
    console.error('❌ Erreur :', error);
    process.exit(1);
  }
}

addStatutConstraint();


#!/usr/bin/env node

/**
 * Réinitialise le dossier TICPE d'un client donné afin de relancer le workflow complet.
 *
 * Usage :
 *   node server/scripts/reset-ticpe-dossier.cjs [email_client]
 */

const path = require('path');
require('dotenv').config({
  path: process.env.DOTENV_CONFIG_PATH || path.resolve(process.cwd(), '.env'),
});
const { createClient } = require('@supabase/supabase-js');

const TARGET_EMAIL = process.argv[2] || 'alex94@profitum.fr';
const PRODUCT_KEYWORD = 'TICPE';

function assertEnv(variable, label) {
  if (!variable) {
    console.error(`❌ Variable d’environnement manquante: ${label}`);
    process.exit(1);
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

assertEnv(supabaseUrl, 'SUPABASE_URL');
assertEnv(supabaseServiceKey, 'SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        Réinitialisation du dossier TICPE - Profitum          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`📧 Client ciblé : ${TARGET_EMAIL}\n`);

  const { data: client, error: clientError } = await supabase
    .from('Client')
    .select('id, email, company_name')
    .eq('email', TARGET_EMAIL)
    .single();

  if (clientError || !client) {
    throw new Error(`Client introuvable pour ${TARGET_EMAIL}: ${clientError?.message}`);
  }

  const { data: product, error: productError } = await supabase
    .from('ProduitEligible')
    .select('id, nom')
    .ilike('nom', `%${PRODUCT_KEYWORD}%`)
    .single();

  if (productError || !product) {
    throw new Error(`Produit TICPE introuvable: ${productError?.message}`);
  }

  const { data: dossier, error: dossierError } = await supabase
    .from('ClientProduitEligible')
    .select('*')
    .eq('clientId', client.id)
    .eq('produitId', product.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (dossierError || !dossier) {
    throw new Error(`Dossier TICPE introuvable pour ${TARGET_EMAIL}: ${dossierError?.message}`);
  }

  console.log('🆔 Dossier trouvé :', dossier.id);
  console.log('🗑️  Suppression des entrées de timeline existantes...');

  const { error: timelineError } = await supabase
    .from('dossier_timeline')
    .delete()
    .eq('dossier_id', dossier.id);

  if (timelineError) {
    console.warn('⚠️  Impossible de supprimer toute la timeline:', timelineError.message);
  } else {
    console.log('✅ Timeline réinitialisée.');
  }

  console.log('🧹 Nettoyage metadata...');
  const cleanMetadata = {};

  if (dossier.metadata && typeof dossier.metadata === 'object') {
    // Conserver uniquement les clés de simulation/eligibilité utiles
    const allowedKeys = ['simulation', 'eligibility', 'created_by', 'source', 'notes'];
    for (const key of allowedKeys) {
      if (dossier.metadata[key] !== undefined) {
        cleanMetadata[key] = dossier.metadata[key];
      }
    }
  }

  const now = new Date().toISOString();

  console.log('🔄 Mise à jour du dossier...');
  const { data: updatedDossier, error: updateError } = await supabase
    .from('ClientProduitEligible')
    .update({
      statut: 'admin_validated',
      current_step: 2,
      progress: 17,
      charte_signed: false,
      charte_signed_at: null,
      date_expert_accepted: null,
      date_audit_validated_by_client: null,
      date_demande_envoyee: null,
      date_remboursement: null,
      montantFinal: dossier.montantFinal || null,
      metadata: cleanMetadata,
      updated_at: now,
    })
    .eq('id', dossier.id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Impossible de mettre à jour le dossier: ${updateError.message}`);
  }

  console.log('✅ Dossier réinitialisé:');
  console.log(`   - Statut : ${updatedDossier.statut}`);
  console.log(`   - Étape  : ${updatedDossier.current_step}`);
  console.log(`   - Progression : ${updatedDossier.progress}%`);

  console.log('\n🎯 Réinitialisation terminée. Relancez ensuite le script de progression pour vérifier le flux complet.\n');
}

main().catch((error) => {
  console.error('\n❌ Erreur lors de la réinitialisation du dossier:', error.message);
  process.exit(1);
});



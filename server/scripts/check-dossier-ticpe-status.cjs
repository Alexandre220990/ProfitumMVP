#!/usr/bin/env node

/**
 * Vérifie le dossier TICPE du client spécifié et affiche son état actuel.
 */

const path = require('path');
require('dotenv').config({
  path: process.env.DOTENV_CONFIG_PATH || path.resolve(process.cwd(), '.env'),
});
const { createClient } = require('@supabase/supabase-js');

const TARGET_EMAIL = process.argv[2] || 'alex94@profitum.fr';

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d’environnement Supabase manquantes (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║    Vérification du dossier TICPE pour le client cible       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`📧 Client cible : ${TARGET_EMAIL}\n`);

  // 1. Récupérer le client
  const { data: clients, error: clientError } = await supabase
    .from('Client')
    .select('id, email, company_name, first_name, last_name, created_at')
    .eq('email', TARGET_EMAIL)
    .limit(1);

  if (clientError) {
    console.error('❌ Erreur lors de la récupération du client :', clientError.message);
    process.exit(1);
  }

  if (!clients || clients.length === 0) {
    console.log('⚠️  Aucun client trouvé avec cet email.');
    process.exit(0);
  }

  const client = clients[0];

  console.log('👤 Client trouvé');
  console.log(`   ID              : ${client.id}`);
  console.log(`   Société         : ${client.company_name || '—'}`);
  console.log(`   Nom             : ${[client.first_name, client.last_name].filter(Boolean).join(' ') || '—'}`);
  console.log(`   Date inscription: ${client.created_at}\n`);

  // 2. Identifier les produits TICPE
  const { data: ticpeProducts, error: productError } = await supabase
    .from('ProduitEligible')
    .select('id, nom, type_produit')
    .ilike('nom', '%TICPE%');

  if (productError) {
    console.error('❌ Erreur lors de la récupération des produits TICPE :', productError.message);
    process.exit(1);
  }

  if (!ticpeProducts || ticpeProducts.length === 0) {
    console.log('⚠️  Aucun produit TICPE actif trouvé.');
    process.exit(0);
  }

  console.log('🏷️  Produits TICPE disponibles :');
  ticpeProducts.forEach((product) => {
    console.log(`   • ${product.nom} (id=${product.id}, type=${product.type_produit || '—'})`);
  });
  console.log('');

  const ticpeProductIds = ticpeProducts.map((product) => product.id);

  // 3. Récupérer les dossiers TICPE du client
  const { data: dossiers, error: dossierError } = await supabase
    .from('ClientProduitEligible')
    .select(
      [
        'id',
        'statut',
        'current_step',
        'progress',
        'metadata',
        'updated_at',
        'created_at',
        'expert_id',
        'ProduitEligible:produitId (nom, type_produit)',
        'Expert:expert_id (name)',
      ].join(', ')
    )
    .eq('clientId', client.id)
    .in('produitId', ticpeProductIds)
    .order('created_at', { ascending: false });

  if (dossierError) {
    console.error('❌ Erreur lors de la récupération des dossiers TICPE :', dossierError.message);
    process.exit(1);
  }

  if (!dossiers || dossiers.length === 0) {
    console.log('⚠️  Aucun dossier TICPE trouvé pour ce client.');
    process.exit(0);
  }

  console.log('📁 Dossiers TICPE associés :\n');

  dossiers.forEach((dossier, index) => {
    const produit = dossier.ProduitEligible || {};
    const expert = dossier.Expert || {};
    const metadata = dossier.metadata || {};

    console.log(`──────────────────── Dossier n°${index + 1} ────────────────────`);
    console.log(`🆔 ID dossier        : ${dossier.id}`);
    console.log(`🏷️  Produit           : ${produit.nom || '—'}`);
    console.log(`👨‍🔧 Expert assigné   : ${expert.name || dossier.expert_id || '—'}`);
    console.log(`📊 Statut            : ${dossier.statut}`);
    console.log(`🔢 Étape actuelle    : ${dossier.current_step}`);
    console.log(`📈 Progression       : ${dossier.progress != null ? dossier.progress + '%' : '—'}`);
    console.log(`🧾 Metadata (clé doc): ${metadata.documents_missing || '—'}`);
    console.log(`🕒 Créé le           : ${dossier.created_at}`);
    console.log(`🕒 Dernière mise à jour: ${dossier.updated_at}`);
    console.log('');
  });

  console.log('✅ Vérification terminée.\n');
}

main().catch((error) => {
  console.error('❌ Erreur inattendue :', error);
  process.exit(1);
});



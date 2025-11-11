#!/usr/bin/env node
/**
 * Migration des anciens dossiers "Optimisation Énergie" vers
 * deux dossiers distincts :
 *  - Optimisation fournisseur électricité
 *  - Optimisation fournisseur gaz
 *
 * Le script :
 * 1. Récupère tous les ClientProduitEligible associés à l'ancien produit.
 * 2. Crée, pour chaque dossier, les deux déclinaisons si elles n'existent pas déjà.
 * 3. Archive l'ancien dossier en ajoutant un marqueur de migration.
 *
 * ⚠️ Le script est idempotent : il peut être relancé sans dupliquer les dossiers.
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

const dotenvPath = path.resolve(__dirname, '../.env');
const envLoaded = dotenv.config({ path: dotenvPath });

if (envLoaded.error) {
  console.warn('⚠️ Impossible de charger le fichier .env. On suppose que les variables sont déjà présentes dans l’environnement.');
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquantes.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const ENERGY_LEGACY_PRODUCT_NAME = 'Optimisation Énergie';
const ENERGY_SPLIT_TARGETS = [
  {
    nom: 'Optimisation fournisseur électricité',
    variant: 'electricite',
    label: 'électricité'
  },
  {
    nom: 'Optimisation fournisseur gaz',
    variant: 'gaz',
    label: 'gaz naturel'
  }
];

async function fetchProducts() {
  const { data, error } = await supabase
    .from('ProduitEligible')
    .select('id, nom')
    .in('nom', [ENERGY_LEGACY_PRODUCT_NAME, ...ENERGY_SPLIT_TARGETS.map((item) => item.nom)]);

  if (error) {
    throw new Error(`Erreur récupération produits: ${error.message}`);
  }

  const legacy = data?.find((item) => item.nom === ENERGY_LEGACY_PRODUCT_NAME);
  const splits = data
    ?.filter((item) => item.nom !== ENERGY_LEGACY_PRODUCT_NAME)
    .reduce((acc, item) => {
      acc[item.nom] = item;
      return acc;
    }, {});

  if (!legacy) {
    throw new Error('Produit "Optimisation Énergie" non trouvé.');
  }

  return { legacyProduct: legacy, splitProducts: splits || {} };
}

async function fetchLegacyDossiers(legacyProductId) {
  const { data, error } = await supabase
    .from('ClientProduitEligible')
    .select(
      'id, clientId, produitId, statut, tauxFinal, montantFinal, dureeFinale, metadata, notes, priorite, dateEligibilite, current_step, progress, simulationId, created_at, updated_at, calcul_details'
    )
    .eq('produitId', legacyProductId);

  if (error) {
    throw new Error(`Erreur récupération dossiers: ${error.message}`);
  }

  return data || [];
}

function buildMetadata(baseMetadata, extra) {
  const metadata = typeof baseMetadata === 'object' && baseMetadata !== null ? { ...baseMetadata } : {};
  return {
    ...metadata,
    ...extra
  };
}

async function ensureSplitDossier({
  baseDossier,
  targetProduit,
  variant,
  label
}) {
  const { data: existing, error: existingError } = await supabase
    .from('ClientProduitEligible')
    .select('id')
    .eq('clientId', baseDossier.clientId)
    .eq('produitId', targetProduit.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Erreur vérification dossier existant (${label}): ${existingError.message}`);
  }

  if (existing) {
    console.log(`➡️  Dossier ${label} déjà présent pour client ${baseDossier.clientId}, skip.`);
    return null;
  }

  const newMetadata = buildMetadata(baseDossier.metadata, {
    split_from: ENERGY_LEGACY_PRODUCT_NAME,
    energy_variant: variant,
    migrated_from_cpe_id: baseDossier.id,
    migrated_at: new Date().toISOString()
  });

  const notesSegments = [
    baseDossier.notes || 'Produit éligible migré',
    `Variante ${label}`
  ];

  const { data: inserted, error: insertError } = await supabase
    .from('ClientProduitEligible')
    .insert({
      clientId: baseDossier.clientId,
      produitId: targetProduit.id,
      statut: baseDossier.statut === 'archived' ? 'eligible' : baseDossier.statut,
      tauxFinal: baseDossier.tauxFinal,
      montantFinal: baseDossier.montantFinal,
      dureeFinale: baseDossier.dureeFinale,
      priorite: baseDossier.priorite,
      notes: notesSegments.filter(Boolean).join(' • '),
      metadata: newMetadata,
      dateEligibilite: baseDossier.dateEligibilite || new Date().toISOString(),
      current_step: Math.min(baseDossier.current_step || 0, 1),
      progress: baseDossier.progress || 0,
      simulationId: baseDossier.simulationId,
      calcul_details: baseDossier.calcul_details
    })
    .select('id')
    .single();

  if (insertError) {
    throw new Error(`Erreur insertion dossier ${label}: ${insertError.message}`);
  }

  console.log(`✅ Nouveau dossier ${label} créé (${inserted.id}) pour client ${baseDossier.clientId}`);
  return inserted.id;
}

async function archiveLegacyDossier(dossier) {
  if (dossier.metadata?.migrated_energy_split) {
    console.log(`➡️  Dossier legacy ${dossier.id} déjà archivé, skip.`);
    return;
  }

  const updatedMetadata = buildMetadata(dossier.metadata, {
    migrated_energy_split: true,
    archived_at: new Date().toISOString()
  });

  const archiveNotes = [`[ARCHIVÉ] Remplacé par dossiers électricité & gaz`, dossier.notes]
    .filter(Boolean)
    .join(' • ');

  const { error } = await supabase
    .from('ClientProduitEligible')
    .update({
      statut: 'archived',
      metadata: updatedMetadata,
      notes: archiveNotes,
      current_step: 0,
      progress: 0
    })
    .eq('id', dossier.id);

  if (error) {
    throw new Error(`Erreur archivage dossier legacy ${dossier.id}: ${error.message}`);
  }

  console.log(`🗄️  Dossier legacy ${dossier.id} archivé.`);
}

async function run() {
  console.log('🚀 Migration des dossiers "Optimisation Énergie"...');

  const { legacyProduct, splitProducts } = await fetchProducts();
  const legacyDossiers = await fetchLegacyDossiers(legacyProduct.id);

  if (!legacyDossiers.length) {
    console.log('✅ Aucun dossier legacy à migrer.');
    return;
  }

  console.log(`📦 ${legacyDossiers.length} dossier(s) legacy à traiter.`);

  for (const dossier of legacyDossiers) {
    try {
      console.log('----------------------------------------');
      console.log(`👤 Client: ${dossier.clientId} • Dossier legacy ${dossier.id}`);

      for (const target of ENERGY_SPLIT_TARGETS) {
        const targetProduit = splitProducts[target.nom];
        if (!targetProduit) {
          console.warn(`⚠️ Produit cible manquant (${target.nom}), dossier ignoré pour cette variante.`);
          continue;
        }

        await ensureSplitDossier({
          baseDossier: dossier,
          targetProduit,
          variant: target.variant,
          label: target.label
        });
      }

      await archiveLegacyDossier(dossier);
    } catch (error) {
      console.error('❌ Erreur migration dossier:', error.message);
    }
  }

  console.log('🎉 Migration terminée.');
}

run().catch((error) => {
  console.error('❌ Erreur inattendue:', error);
  process.exit(1);
});


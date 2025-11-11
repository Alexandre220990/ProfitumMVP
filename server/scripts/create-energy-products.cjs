#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY non définies. Ajoutez-les dans server/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const BASE_RULE = {
  value: 'Oui',
  operator: 'equals',
  question_id: 'GENERAL_005'
};

const BASE_FORMULA = {
  type: 'multiplication_sequence',
  operations: [
    { var: 'montant_factures_energie_mois', multiply: 12 },
    { result: 'factures_annuelles', multiply: 0.3 }
  ],
  formula_display: 'factures_mois × 12 × 30%'
};

const PRODUCTS = [
  {
    nom: 'Optimisation fournisseur électricité',
    description: 'Renégociation complète de vos contrats d’électricité.',
    notes: 'Économies via mise en concurrence des fournisseurs d’électricité et ajustement des puissances.',
    variant: 'electricite'
  },
  {
    nom: 'Optimisation fournisseur gaz',
    description: 'Optimisation de vos contrats de gaz naturel.',
    notes: 'Économies via renégociation des contrats gaz et suivi des consommations.',
    variant: 'gaz'
  }
];

async function ensureProduct({ nom, description, notes }) {
  const { data: existing, error: fetchError } = await supabase
    .from('ProduitEligible')
    .select('*')
    .eq('nom', nom)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Erreur récupération produit ${nom}: ${fetchError.message}`);
  }

  if (existing) {
    console.log(`➡️  Produit déjà présent: ${nom} (id: ${existing.id})`);
    return existing;
  }

  const payload = {
    nom,
    description,
    categorie: 'general',
    type_produit: 'financier',
    formule_calcul: BASE_FORMULA,
    parametres_requis: ['contrats_energie', 'montant_factures_energie_mois'],
    notes_affichage: notes,
    active: true,
    duree_max: 36
  };

  const { data: inserted, error: insertError } = await supabase
    .from('ProduitEligible')
    .insert(payload)
    .select('*')
    .single();

  if (insertError) {
    throw new Error(`Erreur insertion produit ${nom}: ${insertError.message}`);
  }

  console.log(`✅ Produit créé: ${nom} (id: ${inserted.id})`);
  return inserted;
}

async function ensureEligibilityRule(product) {
  const { data: existing, error: fetchError } = await supabase
    .from('EligibilityRules')
    .select('*')
    .eq('produit_id', product.id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Erreur récupération règle pour ${product.nom}: ${fetchError.message}`);
  }

  if (existing) {
    console.log(`➡️  Règle d’éligibilité déjà présente pour ${product.nom}`);
    return existing;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('EligibilityRules')
    .insert({
      produit_id: product.id,
      produit_nom: product.nom,
      rule_type: 'simple',
      conditions: BASE_RULE,
      priority: 1,
      is_active: true
    })
    .select('*')
    .single();

  if (insertError) {
    throw new Error(`Erreur insertion règle pour ${product.nom}: ${insertError.message}`);
  }

  console.log(`✅ Règle d’éligibilité créée pour ${product.nom}`);
  return inserted;
}

async function run() {
  const createdProducts = [];

  for (const product of PRODUCTS) {
    const entity = await ensureProduct(product);
    await ensureEligibilityRule(entity);
    createdProducts.push(entity);
  }

  console.log('🎉 Terminé. Produits configurés:', createdProducts.map((p) => `${p.nom} (${p.id})`).join(', '));
}

run().catch((error) => {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
});


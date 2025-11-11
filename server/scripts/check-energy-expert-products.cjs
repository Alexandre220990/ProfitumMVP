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

const TARGET_EXPERTS = [
  { email: 'elec@profitum.fr', product: 'Optimisation fournisseur électricité' },
  { email: 'gaz@profitum.fr', product: 'Optimisation fournisseur gaz' }
];

async function fetchExpertWithProducts(email) {
  const { data, error } = await supabase
    .from('Expert')
    .select('id, email, name')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw new Error(`Erreur récupération expert ${email} : ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const { data: productLinks, error: linksError } = await supabase
    .from('ExpertProduitEligible')
    .select('produitId, statut')
    .eq('expertId', data.id);

  if (linksError) {
    throw new Error(`Erreur récupération produits expert ${email} : ${linksError.message}`);
  }

  return { expert: data, productLinks: productLinks || [] };
}

async function fetchProductByName(name) {
  const { data, error } = await supabase
    .from('ProduitEligible')
    .select('id, nom')
    .eq('nom', name)
    .maybeSingle();

  if (error) {
    throw new Error(`Erreur récupération produit ${name} : ${error.message}`);
  }

  return data;
}

async function run() {
  let allGood = true;

  for (const target of TARGET_EXPERTS) {
    console.log('----------------------------------------');
    console.log(`🔎 Vérification expert ${target.email}`);

    const result = await fetchExpertWithProducts(target.email);
    if (!result) {
      console.warn(`⚠️ Expert introuvable : ${target.email}`);
      allGood = false;
      continue;
    }

    const { expert, productLinks } = result;

    const product = await fetchProductByName(target.product);
    if (!product) {
      console.warn(`⚠️ Produit introuvable : ${target.product}`);
      allGood = false;
      continue;
    }

    const assignedProductIds = new Set(productLinks.map((link) => link.produitId));
    const hasProduct = assignedProductIds.has(product.id);

    console.log(`• Expert ID : ${expert.id}`);
    console.log(`• Produit attendu : ${product.nom}`);
    console.log(
      productLinks.length > 0
        ? `• Liens produits : ${productLinks
            .map((link) => `${link.produitId} [${link.statut}]`)
            .join(', ')}`
        : '• Aucun lien ExpertProduitEligible'
    );
    console.log(hasProduct ? '✅ Produit bien assigné' : '❌ Produit manquant');

    if (!hasProduct) {
      allGood = false;
    }
  }

  if (allGood) {
    console.log('🎉 Tous les experts disposent des produits attendus.');
  } else {
    console.log('⚠️ Des assignations de produits sont manquantes.');
  }
}

run().catch((error) => {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
});


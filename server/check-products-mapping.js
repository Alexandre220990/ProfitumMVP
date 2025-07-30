// Script pour vérifier les produits existants et créer un mapping correct
require('dotenv').config({ path: '../.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductsMapping() {
  console.log('🔍 VÉRIFICATION DES PRODUITS ET MAPPING');
  console.log('='.repeat(50));

  try {
    // 1. Récupérer tous les produits éligibles
    console.log('\n1️⃣ Récupération des produits éligibles...');
    
    const { data: produits, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('id, nom, description, categorie')
      .order('nom');

    if (produitsError) {
      console.error('❌ Erreur récupération produits:', produitsError);
      return;
    }

    console.log(`✅ ${produits.length} produits trouvés:`);
    for (const produit of produits) {
      console.log(`   - ${produit.nom} (${produit.categorie}): ${produit.id}`);
    }

    // 2. Créer un mapping basé sur les noms
    console.log('\n2️⃣ Création du mapping...');
    
    const mapping = {};
    const codesToFind = ['TICPE', 'URSSAF', 'DFS', 'FONCIER', 'CIR', 'CEE', 'AUDIT_ENERGETIQUE'];
    
    for (const code of codesToFind) {
      // Chercher par nom contenant le code
      const matchingProduct = produits.find(p => 
        p.nom.toLowerCase().includes(code.toLowerCase()) ||
        p.categorie?.toLowerCase().includes(code.toLowerCase())
      );
      
      if (matchingProduct) {
        mapping[code] = matchingProduct.id;
        console.log(`✅ ${code} -> ${matchingProduct.nom} (${matchingProduct.id})`);
      } else {
        console.log(`❌ ${code} -> Aucun produit trouvé`);
      }
    }

    // 3. Afficher le mapping final
    console.log('\n3️⃣ Mapping final:');
    console.log('const PRODUCT_MAPPING: { [key: string]: string } = {');
    for (const [code, id] of Object.entries(mapping)) {
      console.log(`  '${code}': '${id}',`);
    }
    console.log('};');

    // 4. Vérifier les produits non mappés
    console.log('\n4️⃣ Produits non mappés:');
    const mappedIds = Object.values(mapping);
    const unmappedProducts = produits.filter(p => !mappedIds.includes(p.id));
    
    if (unmappedProducts.length > 0) {
      console.log('Produits disponibles mais non mappés:');
      for (const produit of unmappedProducts) {
        console.log(`   - ${produit.nom} (${produit.categorie}): ${produit.id}`);
      }
    } else {
      console.log('✅ Tous les produits sont mappés');
    }

    console.log('\n🎉 Vérification terminée !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkProductsMapping(); 
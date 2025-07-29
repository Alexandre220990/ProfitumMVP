// Charger les variables d'environnement
require('dotenv').config({ path: '../.env' });

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapping des produits du simulateur vers les UUID de ProduitEligible
const PRODUCT_MAPPING = {
  'TICPE': '32dd9cf8-15e2-4375-86ab-a95158d3ada1',
  'URSSAF': 'd1e8f740-7c2a-4b5e-9a91-0e15c0e7d3a2',
  'DFS': 'e2f9a830-8d3b-4c7c-b590-1d7631c0d4b5',
  'FONCIER': 'c5d2e980-4f63-44c0-b8a9-9d6e8e21c0f7',
  'CIR': '37da1c4e-3fcc-49f8-9acb-9b75e231edfd',
  'CEE': 'b7f3c891-28d9-4982-b0eb-821c9e7cbcf0',
  'AUDIT_ENERGETIQUE': 'bc2b94ec-659b-4cf5-a693-d61178b03caf'
};

async function debugProductMapping() {
  console.log('🔍 DIAGNOSTIC MAPPING PRODUITS');
  console.log('=' .repeat(50));

  try {
    // 1. Vérifier tous les produits dans ProduitEligible
    console.log('\n1️⃣ Vérification des produits dans ProduitEligible...');
    
    const { data: produits, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('*')
      .order('nom');

    if (produitsError) {
      console.error('❌ Erreur récupération produits:', produitsError);
      return;
    }

    console.log(`✅ ${produits?.length || 0} produits trouvés dans ProduitEligible:`);
    for (const produit of produits || []) {
      console.log(`   - ${produit.nom} (${produit.id})`);
    }

    // 2. Vérifier le mapping
    console.log('\n2️⃣ Vérification du mapping...');
    
    for (const [simulatorId, mappedId] of Object.entries(PRODUCT_MAPPING)) {
      const produit = produits?.find(p => p.id === mappedId);
      if (produit) {
        console.log(`✅ ${simulatorId} → ${produit.nom} (${mappedId})`);
      } else {
        console.log(`❌ ${simulatorId} → ${mappedId} (PRODUIT NON TROUVÉ)`);
      }
    }

    // 3. Vérifier les éligibilités récentes
    console.log('\n3️⃣ Vérification des éligibilités récentes...');
    
    const { data: eligibilities, error: eligibilitiesError } = await supabase
      .from('TemporaryEligibility')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (eligibilitiesError) {
      console.error('❌ Erreur récupération éligibilités:', eligibilitiesError);
      return;
    }

    console.log(`✅ ${eligibilities?.length || 0} éligibilités récentes trouvées:`);
    for (const eligibility of eligibilities || []) {
      const mappedId = PRODUCT_MAPPING[eligibility.produit_id];
      const produit = produits?.find(p => p.id === mappedId);
      console.log(`   - ${eligibility.produit_id} (${eligibility.eligibility_score}%) → ${mappedId} → ${produit?.nom || 'NON TROUVÉ'}`);
    }

    // 4. Test de création d'un ClientProduitEligible
    console.log('\n4️⃣ Test de création d\'un ClientProduitEligible...');
    
    // Récupérer un client de test
    const { data: clients, error: clientsError } = await supabase
      .from('Client')
      .select('id')
      .limit(1);

    if (clientsError || !clients || clients.length === 0) {
      console.error('❌ Aucun client trouvé pour le test');
      return;
    }

    const testClientId = clients[0].id;
    const testProduitId = Object.values(PRODUCT_MAPPING)[0]; // Premier produit du mapping
    
    console.log(`   - Client test: ${testClientId}`);
    console.log(`   - Produit test: ${testProduitId}`);

    const testClientProduitEligible = {
      clientId: testClientId,
      produitId: testProduitId,
      statut: 'eligible',
      tauxFinal: 0.85,
      montantFinal: 5000,
      dureeFinale: 12,
      simulationId: null,
      metadata: {
        test: true,
        debug: true
      },
      notes: 'Test de création pour debug',
      priorite: 1,
      dateEligibilite: new Date().toISOString(),
      current_step: 0,
      progress: 0,
      expert_id: null,
      charte_signed: false,
      charte_signed_at: null
    };

    const { data: createdProduct, error: createError } = await supabase
      .from('ClientProduitEligible')
      .insert(testClientProduitEligible)
      .select()
      .single();

    if (createError) {
      console.error('❌ Erreur création ClientProduitEligible:', createError);
      console.error('📋 Détails erreur:', JSON.stringify(createError, null, 2));
    } else {
      console.log('✅ ClientProduitEligible créé avec succès:', createdProduct.id);
      
      // Nettoyage
      await supabase.from('ClientProduitEligible').delete().eq('id', createdProduct.id);
      console.log('✅ Test nettoyé');
    }

    // 5. Vérifier les contraintes de la table
    console.log('\n5️⃣ Vérification des contraintes de la table...');
    
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('get_table_constraints', { table_name: 'ClientProduitEligible' });

    if (constraintsError) {
      console.log('⚠️ Impossible de récupérer les contraintes via RPC');
    } else {
      console.log('📋 Contraintes de la table:', constraints);
    }

    // 6. Résumé
    console.log('\n6️⃣ Résumé du diagnostic...');
    
    const mappingValid = Object.entries(PRODUCT_MAPPING).every(([simulatorId, mappedId]) => {
      return produits?.some(p => p.id === mappedId);
    });

    if (mappingValid) {
      console.log('✅ Le mapping des produits est valide');
    } else {
      console.log('❌ Le mapping des produits contient des erreurs');
    }

    const eligibilitiesValid = eligibilities?.every(e => {
      return PRODUCT_MAPPING[e.produit_id] && produits?.some(p => p.id === PRODUCT_MAPPING[e.produit_id]);
    });

    if (eligibilitiesValid) {
      console.log('✅ Les éligibilités sont compatibles avec le mapping');
    } else {
      console.log('❌ Certaines éligibilités ne sont pas compatibles avec le mapping');
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  }
}

debugProductMapping();
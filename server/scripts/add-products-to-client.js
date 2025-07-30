require('dotenv/config');
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement manquantes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addProductsToClient() {
    const clientId = '546a07b3-564e-4838-aaa4-96128ebca448';
    
    console.log('🔧 AJOUT DE PRODUITS ÉLIGIBLES AU CLIENT');
    console.log('Client ID:', clientId);
    console.log('=====================================\n');

    try {
        // 1. Vérifier que le client existe
        console.log('📋 Vérification du client...');
        const { data: client, error: clientError } = await supabase
            .from('Client')
            .select('*')
            .eq('id', clientId)
            .single();

        if (clientError) {
            console.error('❌ Client non trouvé:', clientError);
            return;
        }
        console.log('✅ Client trouvé:', client.email);

        // 2. Récupérer les produits disponibles
        console.log('\n📋 Récupération des produits disponibles...');
        const { data: produits, error: produitsError } = await supabase
            .from('ProduitEligible')
            .select('*')
            .order('nom');

        if (produitsError) {
            console.error('❌ Erreur produits:', produitsError);
            return;
        }
        console.log('✅ Produits disponibles:', produits.length);

        // 3. Vérifier les produits déjà associés
        console.log('\n📋 Vérification des produits déjà associés...');
        const { data: existingProducts, error: existingError } = await supabase
            .from('ClientProduitEligible')
            .select('*')
            .eq('clientId', clientId);

        if (existingError) {
            console.error('❌ Erreur vérification:', existingError);
            return;
        }
        console.log('✅ Produits déjà associés:', existingProducts.length);

        // 4. Ajouter les produits manquants
        const productsToAdd = ['TICPE', 'URSSAF', 'DFS']; // Produits prioritaires
        const addedProducts = [];

        for (const productName of productsToAdd) {
            const product = produits.find(p => p.nom === productName);
            if (!product) {
                console.log(`⚠️  Produit ${productName} non trouvé`);
                continue;
            }

            // Vérifier si déjà associé
            const alreadyExists = existingProducts.some(ep => ep.produitId === product.id);
            if (alreadyExists) {
                console.log(`ℹ️  Produit ${productName} déjà associé`);
                continue;
            }

            // Ajouter le produit
            const { data: newProduct, error: addError } = await supabase
                .from('ClientProduitEligible')
                .insert({
                    clientId: clientId,
                    produitId: product.id,
                    statut: 'en_cours',
                    tauxFinal: 0,
                    montantFinal: 0
                })
                .select()
                .single();

            if (addError) {
                console.error(`❌ Erreur ajout ${productName}:`, addError);
            } else {
                console.log(`✅ Produit ${productName} ajouté`);
                addedProducts.push(newProduct);
            }
        }

        // 5. Vérification finale
        console.log('\n📋 Vérification finale...');
        const { data: finalProducts, error: finalError } = await supabase
            .from('ClientProduitEligible')
            .select(`
                *,
                ProduitEligible (
                    nom
                )
            `)
            .eq('clientId', clientId);

        if (finalError) {
            console.error('❌ Erreur vérification finale:', finalError);
        } else {
            console.log('✅ Produits éligibles du client:');
            finalProducts.forEach(p => {
                console.log(`  - ${p.ProduitEligible.nom} (${p.statut})`);
            });
        }

        console.log(`\n🎉 Opération terminée. ${addedProducts.length} produits ajoutés.`);

    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}

addProductsToClient(); 
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAdminDossiers() {
  console.log('🔍 Test de l\'API des dossiers admin...\n');

  try {
    // 1. Vérifier les données dans ClientProduitEligible
    console.log('1. Vérification des données ClientProduitEligible:');
    const { data: cpeData, error: cpeError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .limit(5);

    if (cpeError) {
      console.error('❌ Erreur ClientProduitEligible:', cpeError);
    } else {
      console.log('✅ ClientProduitEligible trouvés:', cpeData?.length || 0);
      if (cpeData && cpeData.length > 0) {
        console.log('   Premier enregistrement:', {
          id: cpeData[0].id,
          clientId: cpeData[0].clientId,
          produitId: cpeData[0].produitId,
          statut: cpeData[0].statut
        });
      }
    }

    // 2. Vérifier les clients correspondants
    console.log('\n2. Vérification des clients:');
    if (cpeData && cpeData.length > 0) {
      const clientIds = cpeData.map(cpe => cpe.clientId);
      const { data: clients, error: clientsError } = await supabase
        .from('Client')
        .select('id, email, company_name')
        .in('id', clientIds);

      if (clientsError) {
        console.error('❌ Erreur clients:', clientsError);
      } else {
        console.log('✅ Clients trouvés:', clients?.length || 0);
      }
    }

    // 3. Vérifier les produits correspondants
    console.log('\n3. Vérification des produits:');
    if (cpeData && cpeData.length > 0) {
      const produitIds = cpeData.map(cpe => cpe.produitId);
      const { data: produits, error: produitsError } = await supabase
        .from('ProduitEligible')
        .select('id, nom, description')
        .in('id', produitIds);

      if (produitsError) {
        console.error('❌ Erreur produits:', produitsError);
      } else {
        console.log('✅ Produits trouvés:', produits?.length || 0);
      }
    }

    // 4. Test de la requête complète avec jointures
    console.log('\n4. Test de la requête complète:');
    const { data: dossiersComplets, error: dossiersError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        produitId,
        statut,
        montantFinal,
        tauxFinal,
        dureeFinale,
        created_at,
        updated_at,
        current_step,
        progress,
        metadata,
        notes,
        priorite,
        dateEligibilite,
        Client:Client(
          id,
          email,
          company_name,
          phone_number,
          name,
          city,
          secteurActivite,
          nombreEmployes,
          revenuAnnuel
        ),
        ProduitEligible:ProduitEligible(
          id,
          nom,
          description,
          categorie,
          montant_min,
          montant_max
        ),
        Expert:Expert(
          id,
          name,
          email,
          company_name,
          specializations,
          rating
        )
      `)
      .limit(5);

    if (dossiersError) {
      console.error('❌ Erreur requête complète:', dossiersError);
    } else {
      console.log('✅ Dossiers complets trouvés:', dossiersComplets?.length || 0);
      if (dossiersComplets && dossiersComplets.length > 0) {
        console.log('   Premier dossier complet:', {
          id: dossiersComplets[0].id,
          clientId: dossiersComplets[0].clientId,
          produitId: dossiersComplets[0].produitId,
          statut: dossiersComplets[0].statut,
          client: dossiersComplets[0].Client ? 'Présent' : 'Absent',
          produit: dossiersComplets[0].ProduitEligible ? 'Présent' : 'Absent',
          expert: dossiersComplets[0].Expert ? 'Présent' : 'Absent'
        });
      }
    }

    // 5. Test avec !inner pour voir la différence
    console.log('\n5. Test avec jointures INNER:');
    const { data: dossiersInner, error: innerError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        produitId,
        statut,
        Client:Client!inner(
          id,
          email,
          company_name
        ),
        ProduitEligible:ProduitEligible!inner(
          id,
          nom,
          description
        )
      `)
      .limit(5);

    if (innerError) {
      console.error('❌ Erreur requête INNER:', innerError);
    } else {
      console.log('✅ Dossiers avec INNER trouvés:', dossiersInner?.length || 0);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testAdminDossiers().catch(console.error); 
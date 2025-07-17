import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeMarketplaceDatabase() {
  console.log('🔍 Analyse de la base de données pour la Marketplace Experts...\n');

  try {
    // 1. Analyser la table Expert
    console.log('1️⃣ Table Expert:');
    const { data: experts, error: expertsError } = await supabase
      .from('Expert')
      .select('*')
      .limit(3);

    if (expertsError) {
      console.error('❌ Erreur Expert:', expertsError);
    } else {
      console.log(`✅ ${experts?.length || 0} experts trouvés`);
      if (experts && experts.length > 0) {
        console.log('📋 Structure Expert:', Object.keys(experts[0]));
        console.log('📋 Exemple Expert:', {
          id: experts[0].id,
          name: experts[0].name,
          email: experts[0].email,
          company_name: experts[0].company_name,
          specializations: experts[0].specializations,
          rating: experts[0].rating,
          compensation: experts[0].compensation,
          location: experts[0].location,
          status: experts[0].status
        });
      }
    }

    // 2. Analyser la table ProduitEligible
    console.log('\n2️⃣ Table ProduitEligible:');
    const { data: produits, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('*')
      .limit(5);

    if (produitsError) {
      console.error('❌ Erreur ProduitEligible:', produitsError);
    } else {
      console.log(`✅ ${produits?.length || 0} produits trouvés`);
      if (produits && produits.length > 0) {
        console.log('📋 Structure ProduitEligible:', Object.keys(produits[0]));
        console.log('📋 Produits disponibles:');
        produits.forEach(produit => {
          console.log(`   - ${produit.nom}: ${produit.description}`);
        });
      }
    }

    // 3. Analyser la table ClientProduitEligible
    console.log('\n3️⃣ Table ClientProduitEligible:');
    const { data: clientProduits, error: clientProduitsError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .limit(3);

    if (clientProduitsError) {
      console.error('❌ Erreur ClientProduitEligible:', clientProduitsError);
    } else {
      console.log(`✅ ${clientProduits?.length || 0} ClientProduitEligible trouvés`);
      if (clientProduits && clientProduits.length > 0) {
        console.log('📋 Structure ClientProduitEligible:', Object.keys(clientProduits[0]));
        console.log('📋 Exemple ClientProduitEligible:', {
          id: clientProduits[0].id,
          client_id: clientProduits[0].client_id,
          produit_id: clientProduits[0].produit_id,
          statut: clientProduits[0].statut,
          expert_id: clientProduits[0].expert_id
        });
      }
    }

    // 4. Analyser la table ExpertProduitEligible
    console.log('\n4️⃣ Table ExpertProduitEligible:');
    const { data: expertProduits, error: expertProduitsError } = await supabase
      .from('ExpertProduitEligible')
      .select('*')
      .limit(3);

    if (expertProduitsError) {
      console.error('❌ Erreur ExpertProduitEligible:', expertProduitsError);
    } else {
      console.log(`✅ ${expertProduits?.length || 0} ExpertProduitEligible trouvés`);
      if (expertProduits && expertProduits.length > 0) {
        console.log('📋 Structure ExpertProduitEligible:', Object.keys(expertProduits[0]));
        console.log('📋 Exemple ExpertProduitEligible:', {
          id: expertProduits[0].id,
          expertId: expertProduits[0].expertId,
          produitId: expertProduits[0].produitId,
          niveauExpertise: expertProduits[0].niveauExpertise,
          tarifHoraire: expertProduits[0].tarifHoraire,
          statut: expertProduits[0].statut
        });
      }
    }

    // 5. Analyser la table Specialization
    console.log('\n5️⃣ Table Specialization:');
    const { data: specializations, error: specializationsError } = await supabase
      .from('Specialization')
      .select('*')
      .limit(5);

    if (specializationsError) {
      console.error('❌ Erreur Specialization:', specializationsError);
    } else {
      console.log(`✅ ${specializations?.length || 0} spécialisations trouvées`);
      if (specializations && specializations.length > 0) {
        console.log('📋 Structure Specialization:', Object.keys(specializations[0]));
        console.log('📋 Spécialisations disponibles:');
        specializations.forEach(spec => {
          console.log(`   - ${spec.name}: ${spec.description}`);
        });
      }
    }

    // 6. Analyser la table ExpertSpecialization
    console.log('\n6️⃣ Table ExpertSpecialization:');
    const { data: expertSpecs, error: expertSpecsError } = await supabase
      .from('ExpertSpecialization')
      .select('*')
      .limit(3);

    if (expertSpecsError) {
      console.error('❌ Erreur ExpertSpecialization:', expertSpecsError);
    } else {
      console.log(`✅ ${expertSpecs?.length || 0} ExpertSpecialization trouvés`);
      if (expertSpecs && expertSpecs.length > 0) {
        console.log('📋 Structure ExpertSpecialization:', Object.keys(expertSpecs[0]));
        console.log('📋 Exemple ExpertSpecialization:', expertSpecs[0]);
      }
    }

    // 7. Requête de test : Experts avec leurs spécialisations
    console.log('\n7️⃣ Test : Experts avec leurs spécialisations:');
    const { data: expertsWithSpecs, error: expertsWithSpecsError } = await supabase
      .from('Expert')
      .select(`
        id,
        name,
        email,
        company_name,
        specializations,
        rating,
        compensation,
        location,
        status
      `)
      .eq('status', 'active')
      .limit(3);

    if (expertsWithSpecsError) {
      console.error('❌ Erreur experts avec spécialisations:', expertsWithSpecsError);
    } else {
      console.log(`✅ ${expertsWithSpecs?.length || 0} experts actifs trouvés`);
      if (expertsWithSpecs && expertsWithSpecs.length > 0) {
        console.log('📋 Experts avec spécialisations:');
        expertsWithSpecs.forEach(expert => {
          console.log(`   - ${expert.name} (${expert.company_name}): ${expert.specializations?.join(', ')}`);
        });
      }
    }

    console.log('\n✅ Analyse terminée !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter l'analyse
analyzeMarketplaceDatabase(); 
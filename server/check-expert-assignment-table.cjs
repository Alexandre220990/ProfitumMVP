const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExpertAssignmentTables() {
  try {
    console.log('🔍 Vérification des tables d\'assignation expert...\n');

    // 1. Vérifier la table expertassignment (minuscules)
    console.log('1. Test table "expertassignment" (minuscules)...');
    try {
      const { data: assignments1, error: error1 } = await supabase
        .from('expertassignment')
        .select('*')
        .limit(1);

      if (error1) {
        console.log('❌ Table "expertassignment" non trouvée ou erreur:', error1.message);
      } else {
        console.log('✅ Table "expertassignment" existe');
        console.log(`   Nombre d'enregistrements: ${assignments1?.length || 0}`);
      }
    } catch (e) {
      console.log('❌ Table "expertassignment" non accessible');
    }

    // 2. Vérifier la table ExpertAssignment (majuscules)
    console.log('\n2. Test table "ExpertAssignment" (majuscules)...');
    try {
      const { data: assignments2, error: error2 } = await supabase
        .from('ExpertAssignment')
        .select('*')
        .limit(1);

      if (error2) {
        console.log('❌ Table "ExpertAssignment" non trouvée ou erreur:', error2.message);
      } else {
        console.log('✅ Table "ExpertAssignment" existe');
        console.log(`   Nombre d'enregistrements: ${assignments2?.length || 0}`);
      }
    } catch (e) {
      console.log('❌ Table "ExpertAssignment" non accessible');
    }

    // 3. Vérifier les assignations du client Grandjean Laporte
    console.log('\n3. Vérification des assignations du client Grandjean Laporte...');
    
    // Récupérer l'ID du client
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('id, name, email, company_name')
      .eq('email', 'grandjean.laporte@gmail.com')
      .single();

    if (clientError || !client) {
      console.log('❌ Client Grandjean Laporte non trouvé');
    } else {
      console.log('✅ Client trouvé:', client.company_name);
      
      // Vérifier dans ClientProduitEligible
      const { data: cpe, error: cpeError } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          clientId,
          produitId,
          statut,
          expert_id,
          ProduitEligible(id, nom)
        `)
        .eq('clientId', client.id);

      if (cpeError) {
        console.log('❌ Erreur ClientProduitEligible:', cpeError.message);
      } else {
        console.log(`✅ ${cpe?.length || 0} produits éligibles trouvés pour le client`);
        cpe?.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.ProduitEligible?.nom || 'Produit'} - Expert: ${item.expert_id ? 'Assigné' : 'Non assigné'}`);
        });
      }
    }

    // 4. Vérifier les assignations de l'expert Alexandre
    console.log('\n4. Vérification des assignations de l\'expert Alexandre...');
    
    const { data: expert, error: expertError } = await supabase
      .from('Expert')
      .select('id, name, email, company_name')
      .eq('email', 'alexandre@profitum.fr')
      .single();

    if (expertError || !expert) {
      console.log('❌ Expert Alexandre non trouvé');
    } else {
      console.log('✅ Expert trouvé:', expert.name);
      
      // Vérifier les ClientProduitEligible assignés à cet expert
      const { data: expertCPE, error: expertCPEError } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          clientId,
          produitId,
          statut,
          Client(id, company_name, name),
          ProduitEligible(id, nom)
        `)
        .eq('expert_id', expert.id);

      if (expertCPEError) {
        console.log('❌ Erreur récupération CPE expert:', expertCPEError.message);
      } else {
        console.log(`✅ ${expertCPE?.length || 0} produits assignés à l'expert`);
        expertCPE?.forEach((item, index) => {
          console.log(`   ${index + 1}. Client: ${item.Client?.company_name || item.Client?.name} - Produit: ${item.ProduitEligible?.nom || 'Produit'}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkExpertAssignmentTables(); 
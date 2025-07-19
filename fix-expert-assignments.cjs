const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Correction des assignations ExpertAssignment...\n');

async function fixExpertAssignments() {
  try {
    // 1. Récupérer les assignations avec client_produit_eligible_id NULL
    console.log('1. Récupération des assignations à corriger:');
    const { data: assignmentsToFix, error: fetchError } = await supabase
      .from('expertassignment')
      .select('*')
      .is('client_produit_eligible_id', null);

    if (fetchError) {
      console.log(`❌ Erreur récupération: ${fetchError.message}`);
      return;
    }

    if (!assignmentsToFix || assignmentsToFix.length === 0) {
      console.log('✅ Aucune assignation à corriger');
      return;
    }

    console.log(`✅ ${assignmentsToFix.length} assignations à corriger:`);
    assignmentsToFix.forEach((assignment, index) => {
      console.log(`   ${index + 1}. ID: ${assignment.id} - Expert: ${assignment.expert_id} - Status: ${assignment.status}`);
    });

    // 2. Récupérer les ClientProduitEligible disponibles
    console.log('\n2. Récupération des ClientProduitEligible disponibles:');
    const { data: clientProduits, error: clientProduitsError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        Client (name, email),
        ProduitEligible (nom)
      `)
      .limit(10);

    if (clientProduitsError) {
      console.log(`❌ Erreur ClientProduitEligible: ${clientProduitsError.message}`);
      return;
    }

    if (!clientProduits || clientProduits.length === 0) {
      console.log('❌ Aucun ClientProduitEligible disponible');
      return;
    }

    console.log(`✅ ${clientProduits.length} ClientProduitEligible disponibles:`);
    clientProduits.forEach((clientProduit, index) => {
      console.log(`   ${index + 1}. ID: ${clientProduit.id} - Client: ${clientProduit.Client?.name || 'N/A'} - Produit: ${clientProduit.ProduitEligible?.nom || 'N/A'}`);
    });

    // 3. Corriger les assignations
    console.log('\n3. Correction des assignations:');
    
    for (let i = 0; i < assignmentsToFix.length; i++) {
      const assignment = assignmentsToFix[i];
      const clientProduit = clientProduits[i % clientProduits.length]; // Distribution cyclique
      
      console.log(`\n   Correction assignation ${i + 1}:`);
      console.log(`   - Assignation ID: ${assignment.id}`);
      console.log(`   - ClientProduitEligible ID: ${clientProduit.id}`);
      console.log(`   - Client: ${clientProduit.Client?.name || 'N/A'}`);
      console.log(`   - Produit: ${clientProduit.ProduitEligible?.nom || 'N/A'}`);

      // Mettre à jour l'assignation
      const { data: updatedAssignment, error: updateError } = await supabase
        .from('expertassignment')
        .update({
          client_produit_eligible_id: clientProduit.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignment.id)
        .select()
        .single();

      if (updateError) {
        console.log(`   ❌ Erreur mise à jour: ${updateError.message}`);
      } else {
        console.log(`   ✅ Assignation corrigée: ${updatedAssignment.id}`);
      }
    }

    // 4. Vérifier les corrections
    console.log('\n4. Vérification des corrections:');
    const { data: correctedAssignments, error: verifyError } = await supabase
      .from('expertassignment')
      .select(`
        *,
        ClientProduitEligible (
          Client (name, email),
          ProduitEligible (nom)
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (verifyError) {
      console.log(`❌ Erreur vérification: ${verifyError.message}`);
    } else if (correctedAssignments && correctedAssignments.length > 0) {
      console.log(`✅ ${correctedAssignments.length} assignations vérifiées:`);
      correctedAssignments.forEach((assignment, index) => {
        console.log(`\n   Assignation ${index + 1}:`);
        console.log(`   - ID: ${assignment.id}`);
        console.log(`   - Expert ID: ${assignment.expert_id}`);
        console.log(`   - Client Produit Eligible ID: ${assignment.client_produit_eligible_id}`);
        console.log(`   - Client: ${assignment.ClientProduitEligible?.Client?.name || 'N/A'}`);
        console.log(`   - Produit: ${assignment.ClientProduitEligible?.ProduitEligible?.nom || 'N/A'}`);
        console.log(`   - Status: ${assignment.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

// Fonction pour créer des assignations de test si nécessaire
async function createTestAssignments() {
  console.log('\n5. Création d\'assignations de test si nécessaire:');
  
  try {
    // Vérifier s'il y a des assignations
    const { count: assignmentCount, error: countError } = await supabase
      .from('expertassignment')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`❌ Erreur comptage: ${countError.message}`);
      return;
    }

    if (assignmentCount > 0) {
      console.log(`✅ ${assignmentCount} assignations existent déjà`);
      return;
    }

    console.log('❌ Aucune assignation trouvée, création d\'assignations de test...');

    // Récupérer un expert
    const { data: experts, error: expertsError } = await supabase
      .from('Expert')
      .select('id')
      .limit(1);

    if (expertsError || !experts || experts.length === 0) {
      console.log('❌ Aucun expert disponible');
      return;
    }

    // Récupérer des ClientProduitEligible
    const { data: clientProduits, error: clientProduitsError } = await supabase
      .from('ClientProduitEligible')
      .select('id')
      .limit(2);

    if (clientProduitsError || !clientProduits || clientProduits.length === 0) {
      console.log('❌ Aucun ClientProduitEligible disponible');
      return;
    }

    // Créer des assignations de test
    for (let i = 0; i < Math.min(2, clientProduits.length); i++) {
      const { data: newAssignment, error: createError } = await supabase
        .from('expertassignment')
        .insert({
          expert_id: experts[0].id,
          client_produit_eligible_id: clientProduits[i].id,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.log(`❌ Erreur création assignation ${i + 1}: ${createError.message}`);
      } else {
        console.log(`✅ Assignation de test créée: ${newAssignment.id}`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création des assignations de test:', error);
  }
}

// Fonction principale
async function main() {
  try {
    await fixExpertAssignments();
    await createTestAssignments();
    
    console.log('\n🎉 Correction terminée !');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Recharger la page de l\'application');
    console.log('2. Vérifier que les assignations s\'affichent dans le tableau');
    console.log('3. Tester les fonctionnalités d\'assignation');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  }
}

main(); 
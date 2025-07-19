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

console.log('🔧 Correction des relations dashboard expert...\n');

async function fixDashboardRelations() {
  try {
    const expertId = 'f5011ed9-ac74-4f29-af6e-fd1dc063c9ad'; // Alexandre Expert
    
    console.log('1. Récupération des données existantes:');
    console.log('=======================================');
    
    // Récupérer les assignations
    const { data: assignments, error: assignmentsError } = await supabase
      .from('expertassignment')
      .select('*')
      .eq('expert_id', expertId);

    if (assignmentsError) {
      console.log(`❌ Erreur assignations: ${assignmentsError.message}`);
      return;
    }

    // Récupérer les ClientProduitEligible
    const { data: clientProduits, error: clientProduitsError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client (name, company_name, email),
        ProduitEligible (nom)
      `)
      .eq('expert_id', expertId);

    if (clientProduitsError) {
      console.log(`❌ Erreur ClientProduitEligible: ${clientProduitsError.message}`);
      return;
    }

    console.log(`✅ ${assignments.length} assignations trouvées`);
    console.log(`✅ ${clientProduits.length} ClientProduitEligible trouvés`);

    // 2. Analyser les relations actuelles
    console.log('\n2. Analyse des relations actuelles:');
    console.log('===================================');
    
    assignments.forEach((assignment, index) => {
      console.log(`\n   Assignation ${index + 1}:`);
      console.log(`   - ID: ${assignment.id}`);
      console.log(`   - Status: ${assignment.status}`);
      console.log(`   - Client Produit Eligible ID: ${assignment.client_produit_eligible_id || 'NULL'}`);
      
      if (assignment.client_produit_eligible_id) {
        const relatedCpe = clientProduits.find(cpe => cpe.id === assignment.client_produit_eligible_id);
        if (relatedCpe) {
          console.log(`   ✅ Relation valide: ${relatedCpe.Client?.company_name || 'N/A'} - ${relatedCpe.ProduitEligible?.nom || 'N/A'}`);
        } else {
          console.log(`   ❌ Relation invalide: ClientProduitEligible ${assignment.client_produit_eligible_id} n'existe pas`);
        }
      } else {
        console.log(`   ⚠️  Pas de relation définie`);
      }
    });

    // 3. Corriger les relations
    console.log('\n3. Correction des relations:');
    console.log('============================');
    
    // Supprimer les assignations avec des relations invalides
    const invalidAssignments = assignments.filter(assignment => {
      if (!assignment.client_produit_eligible_id) return true;
      return !clientProduits.find(cpe => cpe.id === assignment.client_produit_eligible_id);
    });

    console.log(`\n   Suppression de ${invalidAssignments.length} assignations invalides:`);
    for (const assignment of invalidAssignments) {
      console.log(`   - Suppression de l'assignation ${assignment.id}`);
      
      const { error: deleteError } = await supabase
        .from('expertassignment')
        .delete()
        .eq('id', assignment.id);

      if (deleteError) {
        console.log(`   ❌ Erreur suppression: ${deleteError.message}`);
      } else {
        console.log(`   ✅ Assignation supprimée`);
      }
    }

    // 4. Créer de nouvelles assignations valides
    console.log('\n4. Création de nouvelles assignations valides:');
    console.log('=============================================');
    
    const validClientProduits = clientProduits.filter(cpe => 
      !assignments.find(assignment => assignment.client_produit_eligible_id === cpe.id)
    );

    console.log(`\n   Création de ${validClientProduits.length} nouvelles assignations:`);
    for (const cpe of validClientProduits) {
      console.log(`   - Création pour ${cpe.Client?.company_name || 'N/A'} - ${cpe.ProduitEligible?.nom || 'N/A'}`);
      
      const { data: newAssignment, error: createError } = await supabase
        .from('expertassignment')
        .insert({
          expert_id: expertId,
          client_produit_eligible_id: cpe.id,
          status: 'accepted', // Correspond au statut 'en_cours' du ClientProduitEligible
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.log(`   ❌ Erreur création: ${createError.message}`);
      } else {
        console.log(`   ✅ Assignation créée: ${newAssignment.id}`);
      }
    }

    // 5. Vérification finale
    console.log('\n5. Vérification finale:');
    console.log('======================');
    
    const { data: finalAssignments, error: finalAssignmentsError } = await supabase
      .from('expertassignment')
      .select(`
        *,
        ClientProduitEligible (
          Client (company_name),
          ProduitEligible (nom)
        )
      `)
      .eq('expert_id', expertId);

    if (finalAssignmentsError) {
      console.log(`❌ Erreur vérification finale: ${finalAssignmentsError.message}`);
    } else {
      console.log(`\n✅ ${finalAssignments.length} assignations finales:`);
      finalAssignments.forEach((assignment, index) => {
        console.log(`\n   ${index + 1}. ID: ${assignment.id}`);
        console.log(`      - Status: ${assignment.status}`);
        console.log(`      - Client: ${assignment.ClientProduitEligible?.Client?.company_name || 'N/A'}`);
        console.log(`      - Produit: ${assignment.ClientProduitEligible?.ProduitEligible?.nom || 'N/A'}`);
        console.log(`      - Relation: ${assignment.client_produit_eligible_id ? '✅ Valide' : '❌ Invalide'}`);
      });
    }

    // 6. Calcul des métriques finales
    console.log('\n6. Métriques finales:');
    console.log('=====================');
    
    const inProgress = finalAssignments?.filter(a => a.status === 'in_progress').length || 0;
    const accepted = finalAssignments?.filter(a => a.status === 'accepted').length || 0;
    const totalActive = inProgress + accepted;
    
    const enCours = clientProduits?.filter(cpe => cpe.statut === 'en_cours').length || 0;
    
    console.log(`\n   📊 Résultats:`);
    console.log(`   - KPI dossiers actifs: ${totalActive}`);
    console.log(`   - ClientProduitEligible en cours: ${enCours}`);
    console.log(`   - Cohérence: ${totalActive === enCours ? '✅ OK' : '❌ Problème'}`);

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

// Fonction principale
async function main() {
  try {
    await fixDashboardRelations();
    
    console.log('\n🎉 Correction terminée !');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Recharger la page du dashboard expert');
    console.log('2. Vérifier que les KPI correspondent au tableau');
    console.log('3. Tester les fonctionnalités d\'assignation');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  }
}

main(); 
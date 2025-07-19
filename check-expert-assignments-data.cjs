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

console.log('🔍 Vérification des données ExpertAssignment...\n');

async function checkExpertAssignmentsData() {
  try {
    // 1. Vérifier le nombre total d'assignations
    console.log('1. Nombre total d\'assignations:');
    const { count: totalCount, error: countError } = await supabase
      .from('expertassignment')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`❌ Erreur comptage: ${countError.message}`);
    } else {
      console.log(`✅ Total: ${totalCount} assignations`);
    }

    // 2. Lister toutes les assignations avec leurs détails
    console.log('\n2. Détails des assignations:');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('expertassignment')
      .select('*')
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.log(`❌ Erreur récupération: ${assignmentsError.message}`);
    } else if (assignments && assignments.length > 0) {
      console.log(`✅ ${assignments.length} assignations trouvées:`);
      assignments.forEach((assignment, index) => {
        console.log(`\n   Assignation ${index + 1}:`);
        console.log(`   - ID: ${assignment.id}`);
        console.log(`   - Expert ID: ${assignment.expert_id}`);
        console.log(`   - Client Produit Eligible ID: ${assignment.client_produit_eligible_id}`);
        console.log(`   - Status: ${assignment.status || assignment.statut}`);
        console.log(`   - Created At: ${assignment.created_at}`);
        console.log(`   - Updated At: ${assignment.updated_at}`);
      });
    } else {
      console.log('❌ Aucune assignation trouvée');
    }

    // 3. Vérifier les relations avec les experts
    console.log('\n3. Vérification des relations avec les experts:');
    const { data: expertAssignments, error: expertError } = await supabase
      .from('expertassignment')
      .select(`
        *,
        Expert (
          id,
          name,
          email,
          auth_id
        )
      `)
      .limit(5);

    if (expertError) {
      console.log(`❌ Erreur relation Expert: ${expertError.message}`);
    } else if (expertAssignments && expertAssignments.length > 0) {
      console.log(`✅ ${expertAssignments.length} assignations avec experts:`);
      expertAssignments.forEach((assignment, index) => {
        console.log(`\n   Assignation ${index + 1}:`);
        console.log(`   - ID: ${assignment.id}`);
        console.log(`   - Expert: ${assignment.Expert?.name || 'Non trouvé'} (${assignment.Expert?.email || 'N/A'})`);
        console.log(`   - Expert Auth ID: ${assignment.Expert?.auth_id || 'N/A'}`);
      });
    }

    // 4. Vérifier les relations avec les clients
    console.log('\n4. Vérification des relations avec les clients:');
    const { data: clientAssignments, error: clientError } = await supabase
      .from('expertassignment')
      .select(`
        *,
        ClientProduitEligible (
          id,
          Client (
            id,
            name,
            email,
            auth_id
          ),
          ProduitEligible (
            id,
            nom
          )
        )
      `)
      .limit(5);

    if (clientError) {
      console.log(`❌ Erreur relation Client: ${clientError.message}`);
    } else if (clientAssignments && clientAssignments.length > 0) {
      console.log(`✅ ${clientAssignments.length} assignations avec clients:`);
      clientAssignments.forEach((assignment, index) => {
        console.log(`\n   Assignation ${index + 1}:`);
        console.log(`   - ID: ${assignment.id}`);
        console.log(`   - Client: ${assignment.ClientProduitEligible?.Client?.name || 'Non trouvé'}`);
        console.log(`   - Produit: ${assignment.ClientProduitEligible?.ProduitEligible?.nom || 'Non trouvé'}`);
      });
    }

    // 5. Vérifier les experts existants
    console.log('\n5. Experts existants:');
    const { data: experts, error: expertsError } = await supabase
      .from('Expert')
      .select('id, name, email, auth_id')
      .limit(10);

    if (expertsError) {
      console.log(`❌ Erreur experts: ${expertsError.message}`);
    } else if (experts && experts.length > 0) {
      console.log(`✅ ${experts.length} experts trouvés:`);
      experts.forEach((expert, index) => {
        console.log(`   ${index + 1}. ${expert.name} (${expert.email}) - Auth ID: ${expert.auth_id}`);
      });
    }

    // 6. Vérifier les clients existants
    console.log('\n6. Clients existants:');
    const { data: clients, error: clientsError } = await supabase
      .from('Client')
      .select('id, name, email, auth_id')
      .limit(10);

    if (clientsError) {
      console.log(`❌ Erreur clients: ${clientsError.message}`);
    } else if (clients && clients.length > 0) {
      console.log(`✅ ${clients.length} clients trouvés:`);
      clients.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.name} (${client.email}) - Auth ID: ${client.auth_id}`);
      });
    }

    // 7. Vérifier les ClientProduitEligible existants
    console.log('\n7. ClientProduitEligible existants:');
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
    } else if (clientProduits && clientProduits.length > 0) {
      console.log(`✅ ${clientProduits.length} ClientProduitEligible trouvés:`);
      clientProduits.forEach((clientProduit, index) => {
        console.log(`   ${index + 1}. Client: ${clientProduit.Client?.name || 'N/A'} - Produit: ${clientProduit.ProduitEligible?.nom || 'N/A'}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Fonction pour identifier les problèmes
async function identifyIssues() {
  console.log('\n🔍 Identification des problèmes...\n');

  try {
    // Vérifier si les assignations ont des expert_id valides
    console.log('1. Vérification des expert_id valides:');
    const { data: assignments, error } = await supabase
      .from('expertassignment')
      .select('expert_id');

    if (error) {
      console.log(`❌ Erreur: ${error.message}`);
      return;
    }

    if (assignments && assignments.length > 0) {
      const expertIds = [...new Set(assignments.map(a => a.expert_id))];
      console.log(`✅ ${expertIds.length} expert_id uniques trouvés: ${expertIds.join(', ')}`);

      // Vérifier si ces expert_id existent dans la table Expert
      for (const expertId of expertIds) {
        const { data: expert, error: expertError } = await supabase
          .from('Expert')
          .select('id, name')
          .eq('id', expertId)
          .single();

        if (expertError) {
          console.log(`❌ Expert ID ${expertId}: ${expertError.message}`);
        } else {
          console.log(`✅ Expert ID ${expertId}: ${expert.name}`);
        }
      }
    }

    // Vérifier si les assignations ont des client_produit_eligible_id valides
    console.log('\n2. Vérification des client_produit_eligible_id valides:');
    const { data: assignments2, error: error2 } = await supabase
      .from('expertassignment')
      .select('client_produit_eligible_id');

    if (error2) {
      console.log(`❌ Erreur: ${error2.message}`);
      return;
    }

    if (assignments2 && assignments2.length > 0) {
      const clientProduitIds = [...new Set(assignments2.map(a => a.client_produit_eligible_id))];
      console.log(`✅ ${clientProduitIds.length} client_produit_eligible_id uniques trouvés: ${clientProduitIds.join(', ')}`);

      // Vérifier si ces client_produit_eligible_id existent
      for (const clientProduitId of clientProduitIds) {
        const { data: clientProduit, error: clientProduitError } = await supabase
          .from('ClientProduitEligible')
          .select('id')
          .eq('id', clientProduitId)
          .single();

        if (clientProduitError) {
          console.log(`❌ ClientProduitEligible ID ${clientProduitId}: ${clientProduitError.message}`);
        } else {
          console.log(`✅ ClientProduitEligible ID ${clientProduitId}: Existe`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'identification des problèmes:', error);
  }
}

// Fonction principale
async function main() {
  try {
    await checkExpertAssignmentsData();
    await identifyIssues();
    
    console.log('\n🎉 Vérification terminée !');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Vérifier que les expert_id correspondent à des experts existants');
    console.log('2. Vérifier que les client_produit_eligible_id correspondent à des relations existantes');
    console.log('3. Vérifier les politiques RLS sur la table ExpertAssignment');
    console.log('4. Vérifier que l\'utilisateur connecté a les bonnes permissions');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  }
}

main(); 
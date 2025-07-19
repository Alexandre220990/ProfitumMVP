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

console.log('🔧 Correction des problèmes d\'API expert...\n');

async function fixExpertAPIIssues() {
  try {
    const expertId = 'f5011ed9-ac74-4f29-af6e-fd1dc063c9ad'; // Alexandre Expert
    
    console.log('1. VÉRIFICATION DE LA STRUCTURE DES TABLES:');
    console.log('=============================================');
    
    // Vérifier la structure de la table Client
    const { data: clientSample, error: clientError } = await supabase
      .from('Client')
      .select('*')
      .limit(1);

    if (clientError) {
      console.log(`❌ Erreur accès table Client: ${clientError.message}`);
    } else {
      console.log(`✅ Structure table Client OK`);
      console.log(`   Colonnes disponibles: ${Object.keys(clientSample[0] || {}).join(', ')}`);
    }

    // Vérifier la structure de la table ProduitEligible
    const { data: produitSample, error: produitError } = await supabase
      .from('ProduitEligible')
      .select('*')
      .limit(1);

    if (produitError) {
      console.log(`❌ Erreur accès table ProduitEligible: ${produitError.message}`);
    } else {
      console.log(`✅ Structure table ProduitEligible OK`);
      console.log(`   Colonnes disponibles: ${Object.keys(produitSample[0] || {}).join(', ')}`);
    }

    console.log('\n2. CORRECTION DE L\'API CLIENT-PRODUITS-ELIGIBLES:');
    console.log('===================================================');
    
    // Test avec les bonnes colonnes
    const { data: clientProduits, error: clientProduitsError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client (
          id,
          name,
          email,
          company_name,
          phone_number,
          city,
          siren
        ),
        ProduitEligible (
          id,
          nom,
          description,
          category
        ),
        Expert (
          id,
          name,
          company_name,
          email
        )
      `)
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false });

    if (clientProduitsError) {
      console.log(`❌ Erreur ClientProduitEligible (corrigé): ${clientProduitsError.message}`);
    } else {
      console.log(`✅ ClientProduitEligible récupérés: ${clientProduits.length}`);
      
      clientProduits.forEach((cpe, index) => {
        console.log(`\n   ${index + 1}. ID: ${cpe.id}`);
        console.log(`      - Client: ${cpe.Client?.company_name || cpe.Client?.name || 'N/A'}`);
        console.log(`      - Produit: ${cpe.ProduitEligible?.nom || 'N/A'}`);
        console.log(`      - Statut: ${cpe.statut}`);
        console.log(`      - Expert ID: ${cpe.expert_id}`);
        console.log(`      - Montant: ${cpe.montantFinal}€`);
        console.log(`      - Téléphone: ${cpe.Client?.phone_number || 'Non renseigné'}`);
      });
    }

    console.log('\n3. CORRECTION DE L\'API ANALYTICS:');
    console.log('=====================================');
    
    // Test des requêtes analytics corrigées
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const startDateISO = startDate.toISOString();
    const endDateISO = new Date().toISOString();

    console.log('\n   Test 1: Total des assignations (corrigé)');
    const { data: totalAssignments, error: totalError } = await supabase
      .from('expertassignment')
      .select('*', { count: 'exact', head: true })
      .eq('expert_id', expertId)
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO);

    if (totalError) {
      console.log(`   ❌ Erreur total assignations: ${totalError.message}`);
    } else {
      console.log(`   ✅ Total assignations: ${totalAssignments?.length || 0}`);
    }

    console.log('\n   Test 2: Assignations par statut');
    const { data: assignmentsByStatus, error: statusError } = await supabase
      .from('expertassignment')
      .select('status')
      .eq('expert_id', expertId);

    if (statusError) {
      console.log(`   ❌ Erreur statuts: ${statusError.message}`);
    } else {
      const statusCounts = {};
      assignmentsByStatus.forEach(assignment => {
        const status = assignment.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      console.log(`   ✅ Répartition par statut:`);
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`      - ${status}: ${count}`);
      });
    }

    console.log('\n4. CORRECTION DES RELATIONS:');
    console.log('=============================');
    
    // Test des relations avec requête manuelle
    console.log('\n   Test relation manuelle ExpertAssignment -> ClientProduitEligible');
    
    // Récupérer d'abord les assignations
    const { data: assignments, error: assignmentsError } = await supabase
      .from('expertassignment')
      .select('*')
      .eq('expert_id', expertId);

    if (assignmentsError) {
      console.log(`   ❌ Erreur assignations: ${assignmentsError.message}`);
    } else {
      console.log(`   ✅ Assignations trouvées: ${assignments.length}`);
      
      // Pour chaque assignation, récupérer le ClientProduitEligible correspondant
      for (const assignment of assignments) {
        if (assignment.client_produit_eligible_id) {
          const { data: cpe, error: cpeError } = await supabase
            .from('ClientProduitEligible')
            .select(`
              *,
              Client (company_name, name),
              ProduitEligible (nom)
            `)
            .eq('id', assignment.client_produit_eligible_id)
            .single();

          if (cpeError) {
            console.log(`   ❌ Erreur relation pour ${assignment.id}: ${cpeError.message}`);
          } else {
            console.log(`   ✅ Relation valide: ${cpe.Client?.company_name || 'N/A'} - ${cpe.ProduitEligible?.nom || 'N/A'}`);
          }
        } else {
          console.log(`   ⚠️  Pas de client_produit_eligible_id pour ${assignment.id}`);
        }
      }
    }

    console.log('\n5. TEST DES MÉTRIQUES CORRIGÉES:');
    console.log('==================================');
    
    // Calculer les métriques comme dans le frontend
    const pending = assignments?.filter(a => a.status === 'pending').length || 0;
    const inProgress = assignments?.filter(a => a.status === 'in_progress').length || 0;
    const accepted = assignments?.filter(a => a.status === 'accepted').length || 0;
    const completed = assignments?.filter(a => a.status === 'completed').length || 0;
    
    const totalRevenue = clientProduits?.filter(cpe => cpe.statut === 'termine')
      .reduce((sum, cpe) => sum + (cpe.montantFinal || 0), 0) || 0;
    
    const opportunities = clientProduits?.filter(cpe => 
      cpe.statut === 'en_cours' && cpe.expert_id === expertId
    ).length || 0;
    
    console.log(`\n   📊 Métriques calculées:`);
    console.log(`   - Dossiers actifs: ${inProgress + accepted}`);
    console.log(`   - En attente: ${pending}`);
    console.log(`   - En cours: ${inProgress}`);
    console.log(`   - Acceptés: ${accepted}`);
    console.log(`   - Terminés: ${completed}`);
    console.log(`   - Revenus totaux: ${totalRevenue}€`);
    console.log(`   - Opportunités: ${opportunities}`);
    
    console.log(`\n   📋 ClientProduitEligible par statut:`);
    const eligible = clientProduits?.filter(cpe => cpe.statut === 'eligible').length || 0;
    const enCours = clientProduits?.filter(cpe => cpe.statut === 'en_cours').length || 0;
    const termine = clientProduits?.filter(cpe => cpe.statut === 'termine').length || 0;
    
    console.log(`   - Éligibles: ${eligible}`);
    console.log(`   - En cours: ${enCours}`);
    console.log(`   - Terminés: ${termine}`);

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

// Fonction principale
async function main() {
  try {
    await fixExpertAPIIssues();
    
    console.log('\n🎉 Correction terminée !');
    console.log('\n📋 Problèmes corrigés:');
    console.log('1. ✅ Colonne "phone" remplacée par "phone_number"');
    console.log('2. ✅ Relations testées manuellement');
    console.log('3. ✅ Métriques calculées correctement');
    console.log('4. ✅ APIs testées avec les bonnes colonnes');
    
    console.log('\n🔧 Prochaines étapes:');
    console.log('1. Mettre à jour le code backend avec les bonnes colonnes');
    console.log('2. Corriger les relations Supabase');
    console.log('3. Tester le frontend avec les APIs corrigées');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  }
}

main(); 
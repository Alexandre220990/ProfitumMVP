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

console.log('🔍 Analyse des données du dashboard expert...\n');

async function analyzeDashboardData() {
  try {
    const expertId = 'f5011ed9-ac74-4f29-af6e-fd1dc063c9ad'; // Alexandre Expert
    
    console.log('1. ANALYSE DES ASSIGNATIONS (Source des KPI):');
    console.log('==============================================');
    
    // Récupérer toutes les assignations de l'expert
    const { data: assignments, error: assignmentsError } = await supabase
      .from('expertassignment')
      .select('*')
      .eq('expert_id', expertId);

    if (assignmentsError) {
      console.log(`❌ Erreur assignations: ${assignmentsError.message}`);
    } else {
      console.log(`✅ ${assignments.length} assignations trouvées pour l'expert`);
      
      // Analyser par statut
      const statusCounts = {};
      assignments.forEach(assignment => {
        const status = assignment.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      console.log('\n   Répartition par statut:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
      
      // Calculer les dossiers actifs (comme dans le KPI)
      const inProgress = assignments.filter(a => a.status === 'in_progress').length;
      const accepted = assignments.filter(a => a.status === 'accepted').length;
      const totalActive = inProgress + accepted;
      
      console.log(`\n   📊 Dossiers actifs (KPI): ${totalActive}`);
      console.log(`      - in_progress: ${inProgress}`);
      console.log(`      - accepted: ${accepted}`);
    }

    console.log('\n2. ANALYSE DES CLIENTPRODUITELIGIBLE (Source du tableau):');
    console.log('==========================================================');
    
    // Récupérer tous les ClientProduitEligible assignés à l'expert
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
    } else {
      console.log(`✅ ${clientProduits.length} ClientProduitEligible trouvés pour l'expert`);
      
      // Analyser par statut
      const cpeStatusCounts = {};
      clientProduits.forEach(cpe => {
        const status = cpe.statut || 'unknown';
        cpeStatusCounts[status] = (cpeStatusCounts[status] || 0) + 1;
      });
      
      console.log('\n   Répartition par statut:');
      Object.entries(cpeStatusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
      
      // Afficher les détails des ClientProduitEligible
      console.log('\n   Détails des ClientProduitEligible:');
      clientProduits.forEach((cpe, index) => {
        console.log(`\n   ${index + 1}. ID: ${cpe.id}`);
        console.log(`      - Client: ${cpe.Client?.company_name || cpe.Client?.name || 'N/A'}`);
        console.log(`      - Produit: ${cpe.ProduitEligible?.nom || 'N/A'}`);
        console.log(`      - Statut: ${cpe.statut}`);
        console.log(`      - Montant: ${cpe.montantFinal}€`);
        console.log(`      - Progression: ${cpe.progress || 0}%`);
        console.log(`      - Créé le: ${cpe.created_at}`);
      });
    }

    console.log('\n3. ANALYSE DES RELATIONS:');
    console.log('=========================');
    
    // Vérifier les relations entre ExpertAssignment et ClientProduitEligible
    if (assignments && assignments.length > 0) {
      console.log('\n   Relations ExpertAssignment -> ClientProduitEligible:');
      assignments.forEach((assignment, index) => {
        console.log(`\n   Assignation ${index + 1}:`);
        console.log(`   - ID: ${assignment.id}`);
        console.log(`   - Status: ${assignment.status}`);
        console.log(`   - Client Produit Eligible ID: ${assignment.client_produit_eligible_id || 'NULL'}`);
        
        if (assignment.client_produit_eligible_id) {
          const relatedCpe = clientProduits?.find(cpe => cpe.id === assignment.client_produit_eligible_id);
          if (relatedCpe) {
            console.log(`   ✅ Relation trouvée: ${relatedCpe.Client?.company_name || 'N/A'} - ${relatedCpe.ProduitEligible?.nom || 'N/A'}`);
          } else {
            console.log(`   ❌ Aucune relation trouvée pour cet ID`);
          }
        } else {
          console.log(`   ⚠️  Pas de client_produit_eligible_id`);
        }
      });
    }

    console.log('\n4. COMPARAISON KPI vs TABLEAU:');
    console.log('==============================');
    
    // Calculer les métriques comme dans le code frontend
    const pending = assignments?.filter(a => a.status === 'pending').length || 0;
    const inProgress = assignments?.filter(a => a.status === 'in_progress').length || 0;
    const accepted = assignments?.filter(a => a.status === 'accepted').length || 0;
    const completed = assignments?.filter(a => a.status === 'completed').length || 0;
    
    const totalRevenue = clientProduits?.filter(cpe => cpe.statut === 'termine')
      .reduce((sum, cpe) => sum + (cpe.montantFinal || 0), 0) || 0;
    
    const opportunities = clientProduits?.filter(cpe => 
      cpe.statut === 'en_cours' && cpe.expert_id === expertId
    ).length || 0;
    
    console.log('\n   Métriques calculées (comme dans le frontend):');
    console.log(`   - Dossiers actifs (KPI): ${inProgress + accepted}`);
    console.log(`   - Assignations en attente: ${pending}`);
    console.log(`   - Assignations en cours: ${inProgress}`);
    console.log(`   - Assignations acceptées: ${accepted}`);
    console.log(`   - Assignations terminées: ${completed}`);
    console.log(`   - Revenus totaux: ${totalRevenue}€`);
    console.log(`   - Opportunités: ${opportunities}`);
    
    console.log('\n   ClientProduitEligible par statut (Tableau):');
    const eligible = clientProduits?.filter(cpe => cpe.statut === 'eligible').length || 0;
    const enCours = clientProduits?.filter(cpe => cpe.statut === 'en_cours').length || 0;
    const termine = clientProduits?.filter(cpe => cpe.statut === 'termine').length || 0;
    
    console.log(`   - Éligibles: ${eligible}`);
    console.log(`   - En cours: ${enCours}`);
    console.log(`   - Terminés: ${termine}`);

    console.log('\n5. DIAGNOSTIC DU PROBLÈME:');
    console.log('==========================');
    
    console.log('\n   🔍 Problème identifié:');
    console.log('   Le KPI "Dossiers actifs" compte les assignations (ExpertAssignment)');
    console.log('   Le tableau affiche les ClientProduitEligible');
    console.log('   Ce sont deux sources de données différentes !');
    
    console.log('\n   📊 Différences:');
    console.log(`   - KPI dossiers actifs: ${inProgress + accepted}`);
    console.log(`   - ClientProduitEligible en cours: ${enCours}`);
    console.log(`   - ClientProduitEligible éligibles: ${eligible}`);
    
    if ((inProgress + accepted) !== enCours) {
      console.log('\n   ❌ INCOHÉRENCE DÉTECTÉE:');
      console.log(`   Le KPI affiche ${inProgress + accepted} dossiers actifs`);
      console.log(`   Mais le tableau ne montre que ${enCours} dossiers en cours`);
      console.log('   Cela explique pourquoi vous voyez des dossiers dans les KPI mais pas dans le tableau !');
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

// Fonction principale
async function main() {
  try {
    await analyzeDashboardData();
    
    console.log('\n🎉 Analyse terminée !');
    console.log('\n📋 Solutions possibles:');
    console.log('1. Harmoniser les sources de données (KPI et tableau)');
    console.log('2. Utiliser uniquement les ClientProduitEligible pour les deux');
    console.log('3. Utiliser uniquement les ExpertAssignment pour les deux');
    console.log('4. Créer une vue unifiée des données');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
    process.exit(1);
  }
}

main(); 
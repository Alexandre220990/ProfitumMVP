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

console.log('🔍 Test des APIs expert avec erreurs...\n');

async function testExpertAPIs() {
  try {
    const expertId = 'f5011ed9-ac74-4f29-af6e-fd1dc063c9ad'; // Alexandre Expert
    
    console.log('1. TEST DE L\'API CLIENT-PRODUITS-ELIGIBLES:');
    console.log('=============================================');
    
    // Test direct de la requête qui pose problème
    const { data: clientProduits, error: clientProduitsError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        Client (
          id,
          name,
          username,
          email,
          company_name,
          phone,
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
      console.log(`❌ Erreur ClientProduitEligible: ${clientProduitsError.message}`);
      console.log(`   Code: ${clientProduitsError.code}`);
      console.log(`   Details: ${clientProduitsError.details}`);
      console.log(`   Hint: ${clientProduitsError.hint}`);
    } else {
      console.log(`✅ ClientProduitEligible récupérés: ${clientProduits.length}`);
      
      clientProduits.forEach((cpe, index) => {
        console.log(`\n   ${index + 1}. ID: ${cpe.id}`);
        console.log(`      - Client: ${cpe.Client?.company_name || cpe.Client?.name || 'N/A'}`);
        console.log(`      - Produit: ${cpe.ProduitEligible?.nom || 'N/A'}`);
        console.log(`      - Statut: ${cpe.statut}`);
        console.log(`      - Expert ID: ${cpe.expert_id}`);
        console.log(`      - Montant: ${cpe.montantFinal}€`);
      });
    }

    console.log('\n2. TEST DE L\'API ANALYTICS:');
    console.log('=============================');
    
    // Test de la requête analytics qui pose problème
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const startDateISO = startDate.toISOString();
    const endDateISO = new Date().toISOString();

    // Test des requêtes analytics une par une
    console.log('\n   Test 1: Total des assignations');
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

    console.log('\n   Test 2: Assignations terminées');
    const { data: completedAssignments, error: completedError } = await supabase
      .from('expertassignment')
      .select('*', { count: 'exact', head: true })
      .eq('expert_id', expertId)
      .eq('status', 'completed')
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO);

    if (completedError) {
      console.log(`   ❌ Erreur assignations terminées: ${completedError.message}`);
    } else {
      console.log(`   ✅ Assignations terminées: ${completedAssignments?.length || 0}`);
    }

    console.log('\n   Test 3: Revenus totaux');
    const { data: totalRevenue, error: revenueError } = await supabase
      .from('expertassignment')
      .select('compensation_amount')
      .eq('expert_id', expertId)
      .eq('status', 'completed')
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO);

    if (revenueError) {
      console.log(`   ❌ Erreur revenus: ${revenueError.message}`);
    } else {
      const totalAmount = totalRevenue?.reduce((sum, item) => sum + (item.compensation_amount || 0), 0) || 0;
      console.log(`   ✅ Revenus totaux: ${totalAmount}€`);
    }

    console.log('\n3. TEST DES RELATIONS:');
    console.log('=======================');
    
    // Test des relations avec les noms de tables corrects
    console.log('\n   Test relation ExpertAssignment -> ClientProduitEligible');
    const { data: assignmentsWithRelations, error: relationsError } = await supabase
      .from('expertassignment')
      .select(`
        *,
        ClientProduitEligible (
          id,
          statut,
          montantFinal,
          Client (company_name),
          ProduitEligible (nom)
        )
      `)
      .eq('expert_id', expertId);

    if (relationsError) {
      console.log(`   ❌ Erreur relations: ${relationsError.message}`);
    } else {
      console.log(`   ✅ Relations trouvées: ${assignmentsWithRelations.length}`);
      assignmentsWithRelations.forEach((assignment, index) => {
        console.log(`\n      Assignation ${index + 1}:`);
        console.log(`      - ID: ${assignment.id}`);
        console.log(`      - Status: ${assignment.status}`);
        console.log(`      - Client Produit Eligible ID: ${assignment.client_produit_eligible_id || 'NULL'}`);
        
        if (assignment.ClientProduitEligible) {
          console.log(`      ✅ Relation valide: ${assignment.ClientProduitEligible.Client?.company_name || 'N/A'} - ${assignment.ClientProduitEligible.ProduitEligible?.nom || 'N/A'}`);
        } else {
          console.log(`      ❌ Aucune relation trouvée`);
        }
      });
    }

    console.log('\n4. DIAGNOSTIC DES PROBLÈMES:');
    console.log('=============================');
    
    // Vérifier les problèmes potentiels
    console.log('\n   Problème 1: Vérification des noms de colonnes');
    const { data: sampleAssignment, error: sampleError } = await supabase
      .from('expertassignment')
      .select('*')
      .eq('expert_id', expertId)
      .limit(1)
      .single();

    if (sampleError) {
      console.log(`   ❌ Erreur accès expertassignment: ${sampleError.message}`);
    } else {
      console.log(`   ✅ Structure expertassignment OK`);
      console.log(`   Colonnes disponibles: ${Object.keys(sampleAssignment).join(', ')}`);
    }

    console.log('\n   Problème 2: Vérification des politiques RLS');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('ClientProduitEligible')
      .select('id, statut')
      .eq('expert_id', expertId)
      .limit(1);

    if (rlsError) {
      console.log(`   ❌ Erreur RLS ClientProduitEligible: ${rlsError.message}`);
    } else {
      console.log(`   ✅ RLS ClientProduitEligible OK`);
    }

    console.log('\n   Problème 3: Vérification de l\'expert');
    const { data: expert, error: expertError } = await supabase
      .from('Expert')
      .select('*')
      .eq('id', expertId)
      .single();

    if (expertError) {
      console.log(`   ❌ Erreur expert: ${expertError.message}`);
    } else {
      console.log(`   ✅ Expert trouvé: ${expert.name} (${expert.email})`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Fonction principale
async function main() {
  try {
    await testExpertAPIs();
    
    console.log('\n🎉 Test terminé !');
    console.log('\n📋 Résumé des problèmes identifiés:');
    console.log('1. Vérifier les noms de colonnes dans les requêtes');
    console.log('2. Vérifier les politiques RLS sur les tables');
    console.log('3. Vérifier les relations entre les tables');
    console.log('4. Vérifier la configuration de l\'authentification');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  }
}

main(); 
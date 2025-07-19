const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function assignClientToExpert() {
  try {
    console.log('🔍 Début de l\'assignation client -> expert...');

    // 1. Récupérer l'ID du client Grandjean Laporte
    console.log('📋 Recherche du client Grandjean Laporte...');
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('id, name, email, company_name')
      .eq('email', 'grandjean.laporte@gmail.com')
      .single();

    if (clientError || !client) {
      console.error('❌ Client non trouvé:', clientError);
      return;
    }

    console.log('✅ Client trouvé:', {
      id: client.id,
      name: client.name,
      email: client.email,
      company: client.company_name
    });

    // 2. Récupérer l'ID de l'expert Alexandre
    console.log('👨‍💼 Recherche de l\'expert Alexandre...');
    const { data: expert, error: expertError } = await supabase
      .from('Expert')
      .select('id, name, email, company_name, specializations')
      .eq('email', 'alexandre@profitum.fr')
      .single();

    if (expertError || !expert) {
      console.error('❌ Expert non trouvé:', expertError);
      return;
    }

    console.log('✅ Expert trouvé:', {
      id: expert.id,
      name: expert.name,
      email: expert.email,
      company: expert.company_name,
      specializations: expert.specializations
    });

    // 3. Récupérer les produits TICPE et DFS
    console.log('🏷️ Recherche des produits TICPE et DFS...');
    const { data: produits, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('id, nom, description')
      .in('nom', ['TICPE', 'DFS']);

    if (produitsError || !produits || produits.length === 0) {
      console.error('❌ Produits non trouvés:', produitsError);
      return;
    }

    console.log('✅ Produits trouvés:', produits.map(p => ({ id: p.id, nom: p.nom })));

    // 4. Vérifier si le client a déjà des ClientProduitEligible
    console.log('🔍 Vérification des produits éligibles existants...');
    const { data: existingCPE, error: cpeError } = await supabase
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
      console.error('❌ Erreur lors de la récupération des CPE:', cpeError);
      return;
    }

    console.log(`📊 ${existingCPE?.length || 0} produits éligibles existants trouvés`);

    // 5. Créer ou mettre à jour les ClientProduitEligible pour TICPE et DFS
    const assignments = [];

    for (const produit of produits) {
      console.log(`🔄 Traitement du produit ${produit.nom}...`);

      // Vérifier si le CPE existe déjà
      const existingCPEForProduct = existingCPE?.find(cpe => cpe.produitId === produit.id);

      if (existingCPEForProduct) {
        console.log(`📝 Mise à jour du CPE existant pour ${produit.nom}...`);
        
        // Mettre à jour l'expert_id
        const { data: updatedCPE, error: updateError } = await supabase
          .from('ClientProduitEligible')
          .update({
            expert_id: expert.id,
            statut: 'en_cours',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCPEForProduct.id)
          .select('*')
          .single();

        if (updateError) {
          console.error(`❌ Erreur mise à jour CPE ${produit.nom}:`, updateError);
          continue;
        }

        assignments.push(updatedCPE);
        console.log(`✅ CPE ${produit.nom} mis à jour avec l'expert`);

      } else {
        console.log(`🆕 Création d'un nouveau CPE pour ${produit.nom}...`);
        
        // Créer un nouveau ClientProduitEligible
        const { data: newCPE, error: createError } = await supabase
          .from('ClientProduitEligible')
          .insert({
            clientId: client.id,
            produitId: produit.id,
            statut: 'en_cours',
            expert_id: expert.id,
            tauxFinal: 0.85, // Taux par défaut
            montantFinal: 5000, // Montant par défaut
            dureeFinale: 12, // Durée par défaut
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: {
              source: 'manual_assignment',
              assigned_by: 'admin',
              assignment_date: new Date().toISOString()
            },
            notes: `Assignation manuelle à l'expert ${expert.name}`,
            priorite: 1,
            dateEligibilite: new Date().toISOString()
          })
          .select('*')
          .single();

        if (createError) {
          console.error(`❌ Erreur création CPE ${produit.nom}:`, createError);
          continue;
        }

        assignments.push(newCPE);
        console.log(`✅ Nouveau CPE créé pour ${produit.nom}`);
      }
    }

    // 6. Créer les assignations dans la table ExpertAssignment
    console.log('📋 Création des assignations expert...');
    const expertAssignments = [];

    for (const assignment of assignments) {
      console.log(`🔄 Création assignation pour ${assignment.ProduitEligible?.nom || 'produit'}...`);
      
      const { data: expertAssignment, error: eaError } = await supabase
        .from('ExpertAssignment')
        .insert({
          expert_id: expert.id,
          client_id: client.id,
          produit_id: assignment.produitId,
          status: 'accepted',
          assignment_date: new Date().toISOString(),
          accepted_date: new Date().toISOString(),
          compensation_amount: assignment.montantFinal * 0.15, // 15% de commission
          notes: `Assignation manuelle - Client: ${client.company_name || client.name}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (eaError) {
        console.error(`❌ Erreur création assignation expert:`, eaError);
        continue;
      }

      expertAssignments.push(expertAssignment);
      console.log(`✅ Assignation expert créée`);
    }

    // 7. Créer des notifications pour l'expert
    console.log('🔔 Création des notifications...');
    for (const assignment of assignments) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: expert.id,
          user_type: 'expert',
          title: `Nouvelle assignation - ${assignment.ProduitEligible?.nom || 'Produit'}`,
          message: `Vous avez été assigné au client ${client.company_name || client.name} pour le produit ${assignment.ProduitEligible?.nom || 'Produit'}.`,
          notification_type: 'assignment',
          priority: 'high',
          read: false,
          created_at: new Date().toISOString()
        });

      if (notifError) {
        console.error('❌ Erreur création notification:', notifError);
      } else {
        console.log(`✅ Notification créée pour ${assignment.ProduitEligible?.nom || 'produit'}`);
      }
    }

    // 8. Résumé final
    console.log('\n🎉 ASSIGNATION TERMINÉE AVEC SUCCÈS !');
    console.log('=' .repeat(50));
    console.log(`👤 Client: ${client.company_name || client.name} (${client.email})`);
    console.log(`👨‍💼 Expert: ${expert.name} (${expert.email})`);
    console.log(`📦 Produits assignés: ${assignments.length}`);
    console.log(`📋 Assignations expert créées: ${expertAssignments.length}`);
    console.log(`🔔 Notifications envoyées: ${assignments.length}`);
    
    console.log('\n📊 Détail des assignations:');
    assignments.forEach((assignment, index) => {
      console.log(`  ${index + 1}. ${assignment.ProduitEligible?.nom || 'Produit'} - Statut: ${assignment.statut}`);
    });

    console.log('\n✅ Le client devrait maintenant apparaître sur le dashboard de l\'expert !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'assignation:', error);
  }
}

// Exécuter le script
assignClientToExpert(); 
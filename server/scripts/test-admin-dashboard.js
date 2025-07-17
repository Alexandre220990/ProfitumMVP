const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAdminDashboard() {
  console.log('🧪 Test du Dashboard Admin...\n');

  try {
    // 1. Test des KPIs utilisateurs
    console.log('1. Test KPIs utilisateurs...');
    const { count: totalClients } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true });

    const { count: totalExperts } = await supabase
      .from('Expert')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    console.log(`✅ Clients: ${totalClients || 0}, Experts actifs: ${totalExperts || 0}`);

    // 2. Test des KPIs dossiers
    console.log('\n2. Test KPIs dossiers...');
    const { count: totalAudits } = await supabase
      .from('Audit')
      .select('*', { count: 'exact', head: true });

    const { count: completedAudits } = await supabase
      .from('Audit')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'terminé');

    console.log(`✅ Total audits: ${totalAudits || 0}, Complétés: ${completedAudits || 0}`);

    // 3. Test des KPIs financiers
    console.log('\n3. Test KPIs financiers...');
    const { data: auditsData } = await supabase
      .from('Audit')
      .select('potential_gain, obtained_gain');

    const totalPotentialGain = auditsData?.reduce((sum, audit) => 
      sum + (audit.potential_gain || 0), 0) || 0;
    
    const totalObtainedGain = auditsData?.reduce((sum, audit) => 
      sum + (audit.obtained_gain || 0), 0) || 0;

    console.log(`✅ Gains potentiels: ${totalPotentialGain}€, Obtenus: ${totalObtainedGain}€`);

    // 4. Test des assignations
    console.log('\n4. Test des assignations...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('expertassignment')
      .select(`
        *,
        Expert (id, name, email),
        ClientProduitEligible (
          id,
          Client (id, nom, prenom),
          ProduitEligible (id, nom)
        )
      `)
      .limit(5);

    if (assignmentsError) {
      console.error('❌ Erreur assignations:', assignmentsError);
    } else {
      console.log(`✅ ${assignments.length} assignations trouvées`);
      if (assignments.length > 0) {
        console.log('   Exemple:', {
          id: assignments[0].id,
          status: assignments[0].status,
          expert: assignments[0].Expert?.name,
          client: assignments[0].ClientProduitEligible?.Client?.nom
        });
      }
    }

    // 5. Test des notifications
    console.log('\n5. Test des notifications...');
    const { data: notifications, error: notificationsError } = await supabase
      .from('notification_final')
      .select('*')
      .eq('user_type', 'admin')
      .limit(5);

    if (notificationsError) {
      console.error('❌ Erreur notifications:', notificationsError);
    } else {
      console.log(`✅ ${notifications.length} notifications admin trouvées`);
      if (notifications.length > 0) {
        console.log('   Exemple:', {
          id: notifications[0].id,
          title: notifications[0].title,
          type: notifications[0].notification_type,
          priority: notifications[0].priority
        });
      }
    }

    // 6. Test des produits éligibles
    console.log('\n6. Test des produits éligibles...');
    const { data: clientProduits, error: produitsError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        statut,
        ProduitEligible (id, nom)
      `)
      .limit(10);

    if (produitsError) {
      console.error('❌ Erreur produits:', produitsError);
    } else {
      const eligibleCount = clientProduits.filter(cp => cp.statut === 'eligible').length;
      console.log(`✅ ${clientProduits.length} produits clients, ${eligibleCount} éligibles`);
    }

    // 7. Test de la répartition géographique
    console.log('\n7. Test répartition géographique...');
    const { data: locationData, error: locationError } = await supabase
      .from('Client')
      .select('city')
      .not('city', 'is', null)
      .limit(20);

    if (locationError) {
      console.error('❌ Erreur localisation:', locationError);
    } else {
      const cityStats = locationData.reduce((acc, client) => {
        acc[client.city] = (acc[client.city] || 0) + 1;
        return acc;
      }, {});

      console.log('✅ Répartition par ville:', Object.keys(cityStats).slice(0, 5));
    }

    // 8. Test des performances expert
    console.log('\n8. Test performances expert...');
    const { data: expertStats, error: expertError } = await supabase
      .from('Expert')
      .select(`
        id,
        name,
        rating,
        compensation,
        specializations
      `)
      .eq('status', 'active')
      .limit(5);

    if (expertError) {
      console.error('❌ Erreur experts:', expertError);
    } else {
      console.log(`✅ ${expertStats.length} experts actifs trouvés`);
      if (expertStats.length > 0) {
        console.log('   Exemple:', {
          name: expertStats[0].name,
          rating: expertStats[0].rating,
          compensation: expertStats[0].compensation
        });
      }
    }

    // 9. Test des métriques de conversion
    console.log('\n9. Test métriques de conversion...');
    const { count: totalEligibleProducts } = await supabase
      .from('ClientProduitEligible')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'eligible');

    const conversionRate = totalClients > 0 ? (totalEligibleProducts / totalClients) * 100 : 0;
    const auditRate = totalEligibleProducts > 0 ? (totalAudits / totalEligibleProducts) * 100 : 0;
    const successRate = totalAudits > 0 ? (completedAudits / totalAudits) * 100 : 0;

    console.log('✅ Taux de conversion:', {
      conversion: `${conversionRate.toFixed(1)}%`,
      audit: `${auditRate.toFixed(1)}%`,
      success: `${successRate.toFixed(1)}%`
    });

    // 10. Test des alertes de sécurité (simulées)
    console.log('\n10. Test alertes de sécurité...');
    const mockAlerts = [
      {
        id: '1',
        severity: 'medium',
        type: 'authentication',
        title: 'Tentative de connexion suspecte',
        resolved: false
      },
      {
        id: '2',
        severity: 'low',
        type: 'data_protection',
        title: 'Document non sécurisé',
        resolved: true
      }
    ];

    const criticalAlerts = mockAlerts.filter(alert => alert.severity === 'critical' && !alert.resolved);
    console.log(`✅ ${mockAlerts.length} alertes totales, ${criticalAlerts.length} critiques non résolues`);

    console.log('\n🎉 Tests du dashboard admin terminés avec succès !');
    console.log('\n📊 Résumé des métriques:');
    console.log(`   👥 Utilisateurs: ${totalClients + totalExperts}`);
    console.log(`   📁 Dossiers: ${totalAudits} (${completedAudits} complétés)`);
    console.log(`   💰 Revenus: ${totalObtainedGain}€ / ${totalPotentialGain}€`);
    console.log(`   📈 Conversion: ${conversionRate.toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter les tests
async function main() {
  await testAdminDashboard();
  process.exit(0);
}

main().catch(console.error); 
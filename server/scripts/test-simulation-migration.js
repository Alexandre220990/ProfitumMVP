#!/usr/bin/env node

/**
 * 🧪 TEST DE LA MIGRATION DES RÉSULTATS DE SIMULATION
 * Tester le système de migration vers ClientProduitEligible
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSimulationMigration() {
  console.log('🧪 TEST DE LA MIGRATION DES RÉSULTATS');
  console.log('=' .repeat(60));

  try {
    // 1. Récupérer une session avec des résultats
    const { data: sessions, error: sessionsError } = await supabase
      .from('TemporarySession')
      .select(`
        *,
        TemporaryEligibility (
          produit_id,
          eligibility_score,
          estimated_savings,
          confidence_level,
          recommendations
        )
      `)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionsError || !sessions || sessions.length === 0) {
      console.error('❌ Aucune session trouvée');
      return;
    }

    const session = sessions[0];
    console.log(`📊 Session testée: ${session.session_token}`);
    console.log(`   - Éligibilités: ${session.TemporaryEligibility?.length || 0}`);

    // 2. Tester la récupération des résultats (route GET)
    console.log('\n🔍 Test récupération résultats...');
    
    const response = await fetch(`http://localhost:3001/api/simulator/results/session/${session.session_token}`);
    const results = await response.json();

    if (results.success) {
      console.log('✅ Récupération réussie');
      console.log(`   - Résultats: ${results.results.length}`);
      
      results.results.forEach(result => {
        console.log(`   - ${result.produit_id}: ${result.estimated_savings}€ (${result.eligibility_score}%)`);
      });
    } else {
      console.log('❌ Erreur récupération:', results.error);
    }

    // 3. Créer un client de test
    console.log('\n👤 Création client de test...');
    
    const { data: testClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        email: `test_migration_${Date.now()}@example.com`,
        username: `TestClient_${Date.now()}`,
        company_name: 'Entreprise Test Migration',
        phone_number: '01 23 45 67 89',
        address: '123 Rue du Test',
        city: 'Paris',
        postal_code: '75001',
        siren: '123456789',
        statut: 'Actif',
        revenuannuel: 1000000,
        secteuractivite: 'Transport',
        nombreemployes: 25,
        ancienneteentreprise: 5
      })
      .select('id')
      .single();

    if (clientError) {
      console.error('❌ Erreur création client:', clientError);
      return;
    }

    console.log(`✅ Client de test créé: ${testClient.id}`);

    // 4. Tester la migration (route POST)
    console.log('\n🔄 Test migration...');
    
    const migrationResponse = await fetch(`http://localhost:3001/api/simulator/migrate/${session.session_token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientId: testClient.id
      })
    });

    const migrationResult = await migrationResponse.json();

    if (migrationResult.success) {
      console.log('✅ Migration réussie');
      console.log(`   - Message: ${migrationResult.message}`);
    } else {
      console.log('❌ Erreur migration:', migrationResult.error);
    }

    // 5. Vérifier les résultats dans ClientProduitEligible
    console.log('\n📋 Vérification ClientProduitEligible...');
    
    const { data: clientEligibility, error: eligibilityError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', testClient.id);

    if (eligibilityError) {
      console.error('❌ Erreur récupération éligibilité:', eligibilityError);
    } else {
      console.log(`✅ ${clientEligibility.length} éligibilités trouvées`);
      
      clientEligibility.forEach(eligibility => {
        console.log(`   - ${eligibility.produitId}: ${eligibility.montantFinal}€ (${eligibility.tauxFinal * 100}%)`);
        console.log(`     Statut: ${eligibility.statut}, Priorité: ${eligibility.priorite}`);
      });
    }

    // 6. Nettoyer le client de test
    console.log('\n🧹 Nettoyage...');
    
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', testClient.id);

    if (deleteError) {
      console.log('⚠️ Erreur suppression client test:', deleteError);
    } else {
      console.log('✅ Client de test supprimé');
    }

    console.log('\n🎯 TEST TERMINÉ AVEC SUCCÈS !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécution
if (require.main === module) {
  testSimulationMigration().catch(console.error);
}

module.exports = { testSimulationMigration }; 
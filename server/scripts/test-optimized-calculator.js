#!/usr/bin/env node

/**
 * 🧪 TEST DU CALCULATEUR OPTIMISÉ DIRECT
 * Tester le calculateur optimisé via l'API
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOptimizedCalculator() {
  console.log('🧪 TEST DU CALCULATEUR OPTIMISÉ DIRECT');
  console.log('=' .repeat(60));

  try {
    // 1. Récupérer une session avec des réponses
    const { data: sessions, error: sessionsError } = await supabase
      .from('TemporarySession')
      .select('*')
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionsError || !sessions || sessions.length === 0) {
      console.error('❌ Aucune session trouvée');
      return;
    }

    const session = sessions[0];
    console.log(`📊 Session testée: ${session.session_token}`);

    // 2. Tester la récupération des résultats optimisés
    console.log('\n🔍 Test récupération résultats optimisés...');
    
    const response = await fetch(`http://localhost:3001/api/simulator/results/session/${session.session_token}`);
    const results = await response.json();

    if (results.success) {
      console.log('✅ Récupération réussie');
      console.log(`   - Résultats: ${results.results.length}`);
      
      let totalSavings = 0;
      results.results.forEach(result => {
        console.log(`   - ${result.produit_id}: ${result.estimated_savings}€ (${result.eligibility_score}%) - ${result.confidence_level}`);
        totalSavings += result.estimated_savings || 0;
      });
      
      console.log(`\n💰 Total économies: ${totalSavings}€`);
      
      // Vérifier si TICPE a des résultats non-nuls
      const ticpeResult = results.results.find(r => r.produit_id === 'TICPE');
      if (ticpeResult && ticpeResult.estimated_savings > 0) {
        console.log('✅ SUCCÈS: TICPE a des résultats optimisés !');
      } else {
        console.log('⚠️ TICPE n\'a pas de résultats optimisés');
      }
    } else {
      console.log('❌ Erreur récupération:', results.error);
    }

    // 3. Tester le recalcul direct via l'API
    console.log('\n🔄 Test recalcul direct...');
    
    // Récupérer les réponses de la session
    const { data: responses, error: responsesError } = await supabase
      .from('TemporaryResponse')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (responsesError || !responses) {
      console.log('❌ Erreur récupération réponses');
      return;
    }

    // Créer une nouvelle session de test
    const { data: testSession, error: testSessionError } = await supabase
      .from('TemporarySession')
      .insert({
        session_token: `test_optimized_${Date.now()}`,
        ip_address: '127.0.0.1',
        user_agent: 'Test Script',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select('*')
      .single();

    if (testSessionError) {
      console.log('❌ Erreur création session test:', testSessionError);
      return;
    }

    console.log(`✅ Session de test créée: ${testSession.session_token}`);

    // Insérer les réponses dans la session de test
    for (const response of responses) {
      const { error: insertError } = await supabase
        .from('TemporaryResponse')
        .insert({
          session_id: testSession.id,
          question_id: response.question_id,
          response_value: response.response_value,
          response_metadata: response.response_metadata
        });

      if (insertError) {
        console.log(`⚠️ Erreur insertion réponse: ${insertError.message}`);
      }
    }

    console.log(`✅ ${responses.length} réponses insérées`);

    // 4. Tester le calcul direct
    console.log('\n🎯 Test calcul direct...');
    
    const calculateResponse = await fetch(`http://localhost:3001/api/simulator/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_token: testSession.session_token
      })
    });

    const calculateResults = await calculateResponse.json();

    if (Array.isArray(calculateResults)) {
      console.log('✅ Calcul direct réussi');
      console.log(`   - Résultats: ${calculateResults.length}`);
      
      let totalSavingsDirect = 0;
      calculateResults.forEach(result => {
        console.log(`   - ${result.produit_id}: ${result.estimated_savings}€ (${result.eligibility_score}%) - ${result.confidence_level}`);
        totalSavingsDirect += result.estimated_savings || 0;
      });
      
      console.log(`\n💰 Total économies (calcul direct): ${totalSavingsDirect}€`);
      
      // Comparer avec les résultats de récupération
      if (Math.abs(totalSavings - totalSavingsDirect) < 1) {
        console.log('✅ COHÉRENCE: Les résultats sont identiques !');
      } else {
        console.log('⚠️ DIFFÉRENCE: Les résultats ne sont pas identiques');
      }
    } else {
      console.log('❌ Erreur calcul direct:', calculateResults);
    }

    // 5. Nettoyer la session de test
    console.log('\n🧹 Nettoyage...');
    
    const { error: deleteError } = await supabase
      .from('TemporarySession')
      .delete()
      .eq('id', testSession.id);

    if (deleteError) {
      console.log('⚠️ Erreur suppression session test:', deleteError);
    } else {
      console.log('✅ Session de test supprimée');
    }

    console.log('\n🎯 TEST TERMINÉ AVEC SUCCÈS !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécution
if (require.main === module) {
  testOptimizedCalculator().catch(console.error);
}

module.exports = { testOptimizedCalculator }; 
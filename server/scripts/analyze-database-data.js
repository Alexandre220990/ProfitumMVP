#!/usr/bin/env node

/**
 * 🔍 ANALYSE DES DONNÉES DE LA BASE
 * Comprendre le format réel des réponses pour corriger le calculateur
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeDatabaseData() {
  console.log('🔍 ANALYSE DES DONNÉES DE LA BASE');
  console.log('=' .repeat(60));

  try {
    // 1. Analyser les questions du questionnaire
    console.log('\n📋 1. QUESTIONS DU QUESTIONNAIRE');
    console.log('─'.repeat(40));
    
    const { data: questions, error: questionsError } = await supabase
      .from('QuestionnaireQuestion')
      .select('*')
      .order('question_order', { ascending: true });

    if (questionsError) {
      console.error('❌ Erreur récupération questions:', questionsError);
      return;
    }

    console.log(`✅ ${questions.length} questions trouvées`);
    
    // Afficher les questions importantes pour TICPE
    const ticpeQuestions = questions.filter(q => 
      q.produits_cibles?.includes('TICPE') || 
      q.question_text?.toLowerCase().includes('véhicule') ||
      q.question_text?.toLowerCase().includes('carburant') ||
      q.question_text?.toLowerCase().includes('secteur')
    );

    console.log('\n🎯 Questions importantes pour TICPE:');
    ticpeQuestions.forEach((q, i) => {
      console.log(`${i + 1}. [${q.question_order}] ${q.question_text}`);
      console.log(`   - Type: ${q.question_type}`);
      console.log(`   - Options: ${JSON.stringify(q.options)}`);
      console.log(`   - Produits cibles: ${q.produits_cibles?.join(', ')}`);
      console.log('');
    });

    // 2. Analyser les sessions récentes
    console.log('\n📋 2. SESSIONS RÉCENTES');
    console.log('─'.repeat(40));
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('TemporarySession')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.error('❌ Erreur récupération sessions:', sessionsError);
      return;
    }

    console.log(`✅ ${sessions.length} sessions récentes trouvées`);
    
    if (sessions.length > 0) {
      const latestSession = sessions[0];
      console.log(`\n📊 Session la plus récente: ${latestSession.session_token}`);
      console.log(`   - Créée: ${latestSession.created_at}`);
      console.log(`   - Complétée: ${latestSession.completed}`);
      console.log(`   - Abandonnée: ${latestSession.abandoned}`);

      // 3. Analyser les réponses de cette session
      console.log('\n📋 3. RÉPONSES DE LA SESSION');
      console.log('─'.repeat(40));
      
      const { data: responses, error: responsesError } = await supabase
        .from('TemporaryResponse')
        .select(`
          *,
          QuestionnaireQuestion (
            question_text,
            question_order,
            question_type,
            options
          )
        `)
        .eq('session_id', latestSession.id)
        .order('created_at', { ascending: true });

      if (responsesError) {
        console.error('❌ Erreur récupération réponses:', responsesError);
        return;
      }

      console.log(`✅ ${responses.length} réponses trouvées pour cette session`);
      
      console.log('\n📝 Détail des réponses:');
      responses.forEach((response, i) => {
        const question = response.QuestionnaireQuestion;
        console.log(`${i + 1}. [${question?.question_order}] ${question?.question_text}`);
        console.log(`   - Question ID: ${response.question_id}`);
        console.log(`   - Type de réponse: ${typeof response.response_value}`);
        console.log(`   - Valeur brute: ${JSON.stringify(response.response_value)}`);
        
        // Analyser le format de la réponse
        if (response.response_value) {
          if (typeof response.response_value === 'string') {
            console.log(`   - Format: string simple`);
            console.log(`   - Contenu: "${response.response_value}"`);
          } else if (Array.isArray(response.response_value)) {
            console.log(`   - Format: array`);
            console.log(`   - Contenu: [${response.response_value.join(', ')}]`);
          } else if (typeof response.response_value === 'object') {
            console.log(`   - Format: object`);
            console.log(`   - Clés: ${Object.keys(response.response_value).join(', ')}`);
            console.log(`   - Contenu: ${JSON.stringify(response.response_value)}`);
          }
        }
        console.log('');
      });

      // 4. Analyser les résultats d'éligibilité
      console.log('\n📋 4. RÉSULTATS D\'ÉLIGIBILITÉ');
      console.log('─'.repeat(40));
      
      const { data: eligibility, error: eligibilityError } = await supabase
        .from('TemporaryEligibility')
        .select('*')
        .eq('session_id', latestSession.id);

      if (eligibilityError) {
        console.error('❌ Erreur récupération éligibilité:', eligibilityError);
      } else {
        console.log(`✅ ${eligibility.length} résultats d'éligibilité trouvés`);
        
        eligibility.forEach(result => {
          console.log(`\n🎯 ${result.produit_id}:`);
          console.log(`   - Score: ${result.eligibility_score}%`);
          console.log(`   - Économies: ${result.estimated_savings}€`);
          console.log(`   - Confiance: ${result.confidence_level}`);
          console.log(`   - Recommandations: ${JSON.stringify(result.recommendations)}`);
        });
      }

      // 5. Analyser les taux TICPE
      console.log('\n📋 5. TAUX TICPE');
      console.log('─'.repeat(40));
      
      const { data: ticpeRates, error: ratesError } = await supabase
        .from('TICPERates')
        .select('*');

      if (ratesError) {
        console.error('❌ Erreur récupération taux TICPE:', ratesError);
      } else {
        console.log(`✅ ${ticpeRates.length} taux TICPE trouvés`);
        
        ticpeRates.forEach(rate => {
          console.log(`\n⛽ ${rate.fuel_type} (${rate.fuel_code}):`);
          console.log(`   - Taux 2024: ${rate.rate_2024}€/${rate.unit}`);
          console.log(`   - Taux 2023: ${rate.rate_2023}€/${rate.unit}`);
          console.log(`   - Conditions: ${rate.eligibility_conditions}`);
        });
      }

      // 6. Analyser les secteurs TICPE
      console.log('\n📋 6. SECTEURS TICPE');
      console.log('─'.repeat(40));
      
      const { data: ticpeSectors, error: sectorsError } = await supabase
        .from('TICPESectors')
        .select('*');

      if (sectorsError) {
        console.error('❌ Erreur récupération secteurs TICPE:', sectorsError);
      } else {
        console.log(`✅ ${ticpeSectors.length} secteurs TICPE trouvés`);
        
        ticpeSectors.forEach(sector => {
          console.log(`\n🏢 ${sector.sector_name} (${sector.sector_code}):`);
          console.log(`   - Score de performance: ${sector.performance_score}/100`);
          console.log(`   - Taux de récupération: ${sector.recovery_rate}%`);
          console.log(`   - Avantages: ${sector.advantages?.join(', ')}`);
        });
      }

    } else {
      console.log('⚠️ Aucune session trouvée');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécution
if (require.main === module) {
  analyzeDatabaseData().catch(console.error);
}

module.exports = { analyzeDatabaseData }; 
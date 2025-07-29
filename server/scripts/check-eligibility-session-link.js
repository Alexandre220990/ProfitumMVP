// Charger les variables d'environnement
require('dotenv').config({ path: '../.env' });

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEligibilitySessionLink() {
  console.log('🔍 VÉRIFICATION LIEN SESSION-ÉLIGIBILITÉ');
  console.log('=' .repeat(50));

  try {
    // 1. Récupérer la dernière session
    console.log('\n1️⃣ Récupération de la dernière session...');
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('TemporarySession')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionsError) {
      console.error('❌ Erreur récupération sessions:', sessionsError);
      return;
    }

    if (!sessions || sessions.length === 0) {
      console.error('❌ Aucune session trouvée');
      return;
    }

    const session = sessions[0];
    console.log('✅ Session trouvée:', {
      id: session.id,
      session_token: session.session_token,
      completed: session.completed,
      created_at: session.created_at
    });

    // 2. Vérifier les éligibilités pour cette session
    console.log('\n2️⃣ Vérification des éligibilités pour cette session...');
    
    const { data: eligibilities, error: eligibilitiesError } = await supabase
      .from('TemporaryEligibility')
      .select('*')
      .eq('session_id', session.id);

    if (eligibilitiesError) {
      console.error('❌ Erreur récupération éligibilités:', eligibilitiesError);
      return;
    }

    console.log(`✅ ${eligibilities?.length || 0} éligibilités trouvées pour session_id: ${session.id}`);
    
    if (eligibilities && eligibilities.length > 0) {
      for (const eligibility of eligibilities) {
        console.log(`   - ${eligibility.produit_id}: ${eligibility.eligibility_score}% (${eligibility.estimated_savings}€)`);
      }
    }

    // 3. Vérifier toutes les éligibilités récentes
    console.log('\n3️⃣ Vérification de toutes les éligibilités récentes...');
    
    const { data: allEligibilities, error: allEligibilitiesError } = await supabase
      .from('TemporaryEligibility')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allEligibilitiesError) {
      console.error('❌ Erreur récupération toutes éligibilités:', allEligibilitiesError);
      return;
    }

    console.log(`✅ ${allEligibilities?.length || 0} éligibilités récentes trouvées:`);
    
    if (allEligibilities && allEligibilities.length > 0) {
      for (const eligibility of allEligibilities) {
        console.log(`   - session_id: ${eligibility.session_id} | ${eligibility.produit_id}: ${eligibility.eligibility_score}%`);
      }
    }

    // 4. Vérifier si le session_id correspond à l'ID de la session
    console.log('\n4️⃣ Vérification de la correspondance session_id...');
    
    const sessionId = session.id;
    const sessionToken = session.session_token;
    
    console.log(`   - ID de session: ${sessionId}`);
    console.log(`   - Token de session: ${sessionToken}`);
    
    // Vérifier les éligibilités avec session_id = ID de session
    const { data: eligibilitiesById, error: eligibilitiesByIdError } = await supabase
      .from('TemporaryEligibility')
      .select('*')
      .eq('session_id', sessionId);

    console.log(`   - Éligibilités avec session_id = ${sessionId}: ${eligibilitiesById?.length || 0}`);

    // Vérifier les éligibilités avec session_id = session_token
    const { data: eligibilitiesByToken, error: eligibilitiesByTokenError } = await supabase
      .from('TemporaryEligibility')
      .select('*')
      .eq('session_id', sessionToken);

    console.log(`   - Éligibilités avec session_id = ${sessionToken}: ${eligibilitiesByToken?.length || 0}`);

    // 5. Conclusion
    console.log('\n5️⃣ Conclusion...');
    
    if (eligibilitiesById && eligibilitiesById.length > 0) {
      console.log('✅ Les éligibilités sont bien liées à l\'ID de session');
      console.log('   - La migration devrait fonctionner');
    } else if (eligibilitiesByToken && eligibilitiesByToken.length > 0) {
      console.log('⚠️ Les éligibilités sont liées au session_token, pas à l\'ID');
      console.log('   - Il faut corriger la logique de migration');
    } else {
      console.log('❌ Aucune éligibilité trouvée pour cette session');
      console.log('   - Problème dans la création des éligibilités');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkEligibilitySessionLink();
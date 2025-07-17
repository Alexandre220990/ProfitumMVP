const API_BASE = 'http://localhost:5001/api';

async function testSessionSimple() {
  console.log('🧪 Test simple de session...\n');
  
  try {
    // 1. Créer une session
    console.log('📋 1. Création de session');
    const sessionResponse = await fetch(`${API_BASE}/simulator/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip_address: '127.0.0.1',
        user_agent: 'Test Simple'
      })
    });

    if (!sessionResponse.ok) {
      throw new Error(`Erreur création session: ${sessionResponse.status}`);
    }

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.session_token;
    console.log(`✅ Session créée: ${sessionToken}`);

    // 2. Vérifier que la session existe
    console.log('\n📋 2. Vérification de la session');
    const sessionsResponse = await fetch(`${API_BASE}/simulator/sessions`);
    
    if (sessionsResponse.ok) {
      const sessions = await sessionsResponse.json();
      const foundSession = sessions.data?.find(s => s.session_token === sessionToken);
      
      if (foundSession) {
        console.log('✅ Session trouvée dans la base de données');
        console.log(`   - ID: ${foundSession.id}`);
        console.log(`   - Completed: ${foundSession.completed}`);
        console.log(`   - Migrated: ${foundSession.migrated_to_account}`);
      } else {
        console.log('❌ Session non trouvée dans la base de données');
      }
    } else {
      console.log('⚠️ Impossible de récupérer les sessions');
    }

    // 3. Tester la route calculate-eligibility
    console.log('\n📋 3. Test calculate-eligibility');
    const eligibilityResponse = await fetch(`${API_BASE}/simulator/calculate-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_token: sessionToken
      })
    });

    if (eligibilityResponse.ok) {
      const result = await eligibilityResponse.json();
      console.log('✅ Calculate-eligibility fonctionne');
      console.log('Résultat:', result);
    } else {
      console.log(`❌ Calculate-eligibility échoue: ${eligibilityResponse.status}`);
      const errorText = await eligibilityResponse.text();
      console.log('Erreur:', errorText);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testSessionSimple(); 
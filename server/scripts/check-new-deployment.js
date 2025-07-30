// Charger les variables d'environnement
require('dotenv').config({ path: '../.env' });

const fetch = require('node-fetch');

// Configuration
const API_URL = 'https://profitummvp-production.up.railway.app';

async function checkNewDeployment() {
  console.log('🔍 VÉRIFICATION DU DÉPLOIEMENT');
  console.log('=' .repeat(40));

  try {
    // 1. Test simple de l'API
    console.log('\n1️⃣ Test de l\'API de migration...');
    
    const testData = {
      sessionToken: 'test-token',
      clientData: { email: 'test@example.com' }
    };

    const response = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const responseText = await response.text();
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Réponse: ${responseText.substring(0, 500)}...`);

    // 2. Vérifier si nos nouveaux logs sont présents
    console.log('\n2️⃣ Vérification des nouveaux logs...');
    
    const hasNewLogs = responseText.includes('VERSION 2.0') || 
                      responseText.includes('CORRECTION: Utilisation de supabaseAdmin') ||
                      responseText.includes('DÉPLOIEMENT FORCÉ');

    if (hasNewLogs) {
      console.log('✅ NOUVEAU CODE DÉPLOYÉ !');
      console.log('   - Les nouveaux logs sont présents');
      console.log('   - La correction supabaseAdmin est active');
    } else {
      console.log('❌ ANCIEN CODE ENCORE ACTIF');
      console.log('   - Les nouveaux logs ne sont pas présents');
      console.log('   - Railway n\'a pas encore redémarré');
    }

    // 3. Analyser la réponse pour identifier le problème
    console.log('\n3️⃣ Analyse de la réponse...');
    
    if (response.status === 500) {
      console.log('🔍 Erreur 500 détectée - Analyse des logs...');
      
      if (responseText.includes('Erreur lors de la récupération des éligibilités')) {
        console.log('❌ PROBLÈME: Ancienne erreur encore présente');
        console.log('   - L\'API utilise encore l\'ancien code');
        console.log('   - Railway n\'a pas redémarré le serveur');
      } else if (responseText.includes('Session non trouvée')) {
        console.log('✅ NOUVEAU CODE ACTIF !');
        console.log('   - L\'API retourne maintenant "Session non trouvée"');
        console.log('   - Plus d\'erreur "récupération des éligibilités"');
      }
    } else if (response.status === 400) {
      console.log('✅ NOUVEAU CODE ACTIF !');
      console.log('   - L\'API retourne 400 (validation des paramètres)');
      console.log('   - Plus d\'erreur 500 avec "récupération des éligibilités"');
    }

    // 4. Test avec une vraie session
    console.log('\n4️⃣ Test avec une vraie session...');
    
    // Récupérer une session existante
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('⚠️ Variables d\'environnement manquantes pour le test complet');
      return;
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('TemporarySession')
      .select('*')
      .eq('completed', true)
      .eq('migrated_to_account', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionsError || !sessions || sessions.length === 0) {
      console.log('⚠️ Aucune session de test disponible');
      return;
    }

    const session = sessions[0];
    console.log(`📋 Session de test: ${session.session_token}`);

    // Créer un client de test
    const timestamp = Date.now();
    const testUserData = {
      username: `deployment-test-${timestamp}`,
      email: `deployment-test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      company_name: 'Test Déploiement',
      phone_number: '0123456789',
      address: '123 Rue Test',
      city: 'Paris',
      postal_code: '75001',
      siren: `${timestamp % 1000000000}`.padStart(9, '0'),
      type: 'client'
    };

    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserData)
    });

    if (!registerResponse.ok) {
      console.log('❌ Erreur création client de test');
      return;
    }

    console.log('✅ Client de test créé');

    // Tester la migration avec une vraie session
    const migrationData = {
      sessionToken: session.session_token,
      clientData: { email: testUserData.email }
    };

    const migrationResponse = await fetch(`${API_URL}/api/session-migration/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(migrationData)
    });

    const migrationText = await migrationResponse.text();
    console.log(`📊 Migration Status: ${migrationResponse.status}`);
    console.log(`📋 Migration Réponse: ${migrationText.substring(0, 300)}...`);

    // Vérifier si la migration a réussi
    if (migrationResponse.status === 200) {
      console.log('🎉 SUCCÈS ! Migration réussie avec le nouveau code');
    } else if (migrationText.includes('Erreur lors de la récupération des éligibilités')) {
      console.log('❌ ÉCHEC ! Ancien code encore actif');
    } else {
      console.log('⚠️ Autre erreur - Code peut-être déployé mais problème différent');
    }

    // Nettoyage
    const { error: deleteClientError } = await supabaseAdmin
      .from('Client')
      .delete()
      .eq('email', testUserData.email);

    if (deleteClientError) {
      console.log('⚠️ Erreur nettoyage client de test');
    } else {
      console.log('✅ Client de test supprimé');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkNewDeployment();
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase CORRECTE depuis le .env
const supabaseUrl = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2a3ZrcGZ0YWt5dHhwc2Jra2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk0MDc0NjEsImV4cCI6MjAyNDk4MzQ2MX0.ckc2_CK5yDRBG5Z5yxYJgXGzGJGpMf-dHDMHk-8GHxs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCompleteAuth() {
  console.log('🔍 Test complet d\'authentification et accès aux produits éligibles');
  console.log('🌐 URL Supabase:', supabaseUrl);
  
  try {
    // 1. Connexion avec les identifiants
    console.log('\n1️⃣ Tentative de connexion...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'grandjean.laporte@gmail.com',
      password: 'profitum'
    });

    if (loginError) {
      console.error('❌ Erreur de connexion:', loginError.message);
      return;
    }

    if (!loginData.user || !loginData.session) {
      console.error('❌ Pas d\'utilisateur ou de session après connexion');
      return;
    }

    console.log('✅ Connexion réussie !');
    console.log('👤 Utilisateur ID:', loginData.user.id);
    console.log('📧 Email:', loginData.user.email);
    console.log('🏷️ Type:', loginData.user.user_metadata?.type);
    console.log('🔑 Token:', loginData.session.access_token.substring(0, 50) + '...');

    const userId = loginData.user.id;
    const token = loginData.session.access_token;

    // 2. Test de la route debug (sans auth)
    console.log('\n2️⃣ Test de la route debug (sans auth)...');
    const responseDebug = await fetch('http://localhost:5001/api/produits-eligibles/debug', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Status debug:', responseDebug.status);
    const debugText = await responseDebug.text();
    console.log('📡 Corps debug:', debugText);

    // 3. Test de la route client avec authentification
    console.log('\n3️⃣ Test de la route client avec authentification...');
    const responseClient = await fetch(`http://localhost:5001/api/produits-eligibles/client/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Status client:', responseClient.status);
    console.log('📡 Headers réponse:', Object.fromEntries(responseClient.headers.entries()));
    
    const responseText = await responseClient.text();
    console.log('📡 Corps réponse client:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));

    // 4. Test avec un autre client ID (doit échouer)
    console.log('\n4️⃣ Test avec un autre client ID (doit échouer)...');
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    const responseFake = await fetch(`http://localhost:5001/api/produits-eligibles/client/${fakeUserId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Status fake client:', responseFake.status);
    const fakeText = await responseFake.text();
    console.log('📡 Corps réponse fake:', fakeText);

    // 5. Test sans token (doit échouer)
    console.log('\n5️⃣ Test sans token (doit échouer)...');
    const responseNoToken = await fetch(`http://localhost:5001/api/produits-eligibles/client/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Status sans token:', responseNoToken.status);
    const noTokenText = await responseNoToken.text();
    console.log('📡 Corps réponse sans token:', noTokenText);

    // 6. Vérification des produits en base
    console.log('\n6️⃣ Vérification des produits en base...');
    const supabaseService = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc2OTg0OSwiZXhwIjoyMDU3MzQ1ODQ5fQ.pN73GQUJHmd099PUcxAVGm-TFTe3KHeBemBk9IlGAcg');
    
    const { data: produits, error: produitsError } = await supabaseService
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', userId);

    if (produitsError) {
      console.error('❌ Erreur récupération produits:', produitsError.message);
    } else {
      console.log('✅ Produits éligibles trouvés en base:', produits.length);
      console.log('📋 Produits:', produits.map(p => ({ id: p.id, produitId: p.produitId, statut: p.statut })));
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Lancer le test
testCompleteAuth().then(() => {
  console.log('\n🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
}); 
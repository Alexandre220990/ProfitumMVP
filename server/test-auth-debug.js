const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase CORRECTE depuis le .env
const supabaseUrl = 'https://gvvlsgtubqfxdztldunj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.pN73GQUJHmd099PUcxAVGm-TFTe3KHeBemBk9IlGAcg';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc2OTg0OSwiZXhwIjoyMDU3MzQ1ODQ5fQ.pN73GQUJHmd099PUcxAVGm-TFTe3KHeBemBk9IlGAcg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('🔍 Test d\'authentification avec grandjean.laporte@gmail.com');
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

    // 2. Test de récupération de session
    console.log('\n2️⃣ Test de récupération de session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erreur récupération session:', sessionError.message);
    } else if (sessionData.session) {
      console.log('✅ Session récupérée avec succès');
      console.log('🔑 Token session:', sessionData.session.access_token.substring(0, 50) + '...');
    } else {
      console.log('⚠️ Aucune session trouvée');
    }

    // 3. Test de récupération d'utilisateur
    console.log('\n3️⃣ Test de récupération d\'utilisateur...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Erreur récupération utilisateur:', userError.message);
    } else if (userData.user) {
      console.log('✅ Utilisateur récupéré avec succès');
      console.log('👤 ID:', userData.user.id);
      console.log('📧 Email:', userData.user.email);
    } else {
      console.log('⚠️ Aucun utilisateur trouvé');
    }

    // 4. Test d'appel API avec le token
    console.log('\n4️⃣ Test d\'appel API avec le token...');
    const token = loginData.session.access_token;
    
    const response = await fetch('http://localhost:5001/api/produits-eligibles', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Status API:', response.status);
    console.log('📡 Headers réponse:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📡 Corps réponse:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));

    // 5. Test avec le token stocké en localStorage (simulation frontend)
    console.log('\n5️⃣ Test avec token localStorage (simulation frontend)...');
    const localStorageToken = token; // Simule le token du localStorage
    
    const response2 = await fetch('http://localhost:5001/api/produits-eligibles', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorageToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Status API (localStorage):', response2.status);
    const responseText2 = await response2.text();
    console.log('📡 Corps réponse (localStorage):', responseText2.substring(0, 200) + (responseText2.length > 200 ? '...' : ''));

    // 6. Vérification des produits éligibles en base
    console.log('\n6️⃣ Vérification des produits éligibles en base...');
    
    // Utiliser le service role key pour accéder directement à la base
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: produits, error: produitsError } = await supabaseService
      .from('produit_eligible')
      .select('*')
      .eq('client_id', loginData.user.id);

    if (produitsError) {
      console.error('❌ Erreur récupération produits:', produitsError.message);
    } else {
      console.log('✅ Produits éligibles trouvés:', produits.length);
      console.log('📋 Produits:', produits.map(p => ({ id: p.id, nom: p.nom, statut: p.statut })));
    }

    // 7. Test de validation du token côté serveur
    console.log('\n7️⃣ Test de validation du token côté serveur...');
    
    // Simuler le middleware d'authentification du serveur
    const jwt = require('jsonwebtoken');
    const jwtSecret = '+aiFgbefNjLDV8MZOPyWt326RzCL1ZAS/JCOuzxG6/dnAp86jDjQKdWsJBCI7dR3p4I+hP70+aA7g+ZZcqSrRA==';
    
    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log('✅ Token JWT valide côté serveur');
      console.log('🔍 Token décodé:', decoded);
    } catch (jwtError) {
      console.log('⚠️ Token JWT invalide côté serveur:', jwtError.message);
      
      // Essayer avec le secret alternatif
      try {
        const decoded2 = jwt.verify(token, 'EhAhS26BXDsowVPe');
        console.log('✅ Token JWT valide avec secret alternatif');
        console.log('🔍 Token décodé:', decoded2);
      } catch (jwtError2) {
        console.log('❌ Token JWT invalide avec secret alternatif:', jwtError2.message);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Lancer le test
testAuth().then(() => {
  console.log('\n🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
}); 
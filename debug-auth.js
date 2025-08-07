// Diagnostic du problème d'authentification
console.log('🔍 === DIAGNOSTIC AUTHENTIFICATION ===');

// 1. Vérifier les tokens stockés
const token = localStorage.getItem('token');
const supabaseToken = localStorage.getItem('supabase_token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

console.log('📋 1. TOKENS STOCKÉS:');
console.log('Token principal:', token ? `${token.substring(0, 30)}...` : 'NULL');
console.log('Token Supabase:', supabaseToken ? `${supabaseToken.substring(0, 30)}...` : 'NULL');
console.log('Utilisateur:', user);

// 2. Test de l'API de santé
console.log('\n📋 2. TEST API SANTÉ:');
fetch('https://profitummvp-production.up.railway.app/api/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ API santé:', data);
  })
  .catch(error => {
    console.error('❌ Erreur API santé:', error);
  });

// 3. Test d'authentification avec token
console.log('\n📋 3. TEST AUTHENTIFICATION:');
if (token) {
  fetch('https://profitummvp-production.up.railway.app/api/calendar/events', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    return response.json();
  })
  .then(data => {
    console.log('✅ Réponse authentification:', data);
  })
  .catch(error => {
    console.error('❌ Erreur authentification:', error);
  });
} else {
  console.log('❌ Pas de token disponible');
}

// 4. Test avec token Supabase
console.log('\n📋 4. TEST AVEC TOKEN SUPABASE:');
if (supabaseToken) {
  fetch('https://profitummvp-production.up.railway.app/api/calendar/events', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${supabaseToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('Status (Supabase):', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ Réponse (Supabase):', data);
  })
  .catch(error => {
    console.error('❌ Erreur (Supabase):', error);
  });
} else {
  console.log('❌ Pas de token Supabase disponible');
}

// 5. Vérifier si l'utilisateur est connecté
console.log('\n📋 5. ÉTAT CONNEXION:');
if (user) {
  console.log('✅ Utilisateur connecté:', {
    id: user.id,
    email: user.email,
    type: user.type
  });
} else {
  console.log('❌ Aucun utilisateur connecté');
}

console.log('\n🔍 === FIN DIAGNOSTIC ===');

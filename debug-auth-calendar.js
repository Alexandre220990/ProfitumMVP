// Diagnostic de l'authentification calendrier
console.log('🔍 Diagnostic de l\'authentification calendrier...');

// 1. Vérifier les tokens dans localStorage
console.log('📋 Tokens dans localStorage:');
console.log('- token:', localStorage.getItem('token'));
console.log('- supabase_token:', localStorage.getItem('supabase_token'));
console.log('- supabase_refresh_token:', localStorage.getItem('supabase_refresh_token'));

// 2. Vérifier l'utilisateur connecté
console.log('👤 Utilisateur connecté:');
console.log('- user:', JSON.parse(localStorage.getItem('user') || 'null'));

// 3. Test de l'API health
console.log('🏥 Test API health...');
fetch('https://profitummvp-production.up.railway.app/api/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ API health:', data);
  })
  .catch(error => {
    console.error('❌ Erreur API health:', error);
  });

// 4. Test de l'API calendrier GET (avec token)
const token = localStorage.getItem('token');
if (token) {
  console.log('📅 Test API calendrier GET...');
  fetch('https://profitummvp-production.up.railway.app/api/calendar/events', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    return response.json();
  })
  .then(data => {
    console.log('✅ Réponse calendrier GET:', data);
  })
  .catch(error => {
    console.error('❌ Erreur calendrier GET:', error);
  });

  // 5. Test de l'API calendrier POST (avec token)
  console.log('📅 Test API calendrier POST...');
  const testEventData = {
    title: 'Test événement',
    description: 'Test de création d\'événement',
    start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    type: 'appointment',
    priority: 'medium',
    status: 'pending',
    category: 'client',
    location: 'Test location',
    is_online: false,
    color: '#3B82F6'
  };

  fetch('https://profitummvp-production.up.railway.app/api/calendar/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testEventData)
  })
  .then(response => {
    console.log('📊 Status POST:', response.status);
    console.log('📊 Headers POST:', Object.fromEntries(response.headers.entries()));
    return response.json();
  })
  .then(data => {
    console.log('✅ Réponse calendrier POST:', data);
  })
  .catch(error => {
    console.error('❌ Erreur calendrier POST:', error);
  });
} else {
  console.log('❌ Aucun token trouvé dans localStorage');
}

// 6. Vérifier la structure du token JWT
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('🔐 Payload JWT:');
    console.log('- exp:', new Date(payload.exp * 1000));
    console.log('- iat:', new Date(payload.iat * 1000));
    console.log('- sub:', payload.sub);
    console.log('- aud:', payload.aud);
    console.log('- iss:', payload.iss);
    
    const now = Date.now() / 1000;
    console.log('- Token expiré:', payload.exp < now);
  } catch (error) {
    console.error('❌ Erreur décodage JWT:', error);
  }
}

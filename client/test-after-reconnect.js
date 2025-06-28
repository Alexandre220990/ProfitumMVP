// Script pour tester l'API après reconnexion
console.log('🧪 Test de l\'API après reconnexion...');

// Vérifier les tokens
const token = localStorage.getItem('token');
const supabaseToken = localStorage.getItem('supabase_token');

console.log('📦 Tokens disponibles:');
console.log('- token:', token ? '✅ Présent' : '❌ Absent');
console.log('- supabase_token:', supabaseToken ? '✅ Présent' : '❌ Absent');

if (!token) {
  console.log('⚠️ Aucun token trouvé - veuillez vous reconnecter');
  return;
}

// Tester l'API de vérification de signature
console.log('🔍 Test de l\'API de vérification de signature...');

fetch('http://[::1]:5001/api/charte-signature/e87d3ef4-a394-4505-8fcc-41a56005c344', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('📡 Réponse API:', response.status, response.statusText);
  return response.json();
})
.then(data => {
  console.log('📄 Données de réponse:', data);
  
  if (data.success) {
    console.log('✅ API fonctionne correctement avec le token Supabase');
  } else {
    console.log('❌ Erreur API:', data.message);
  }
})
.catch(error => {
  console.error('❌ Erreur lors du test API:', error);
});

// Tester l'API de signature
console.log('📝 Test de l\'API de signature...');

fetch('http://[::1]:5001/api/charte-signature', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clientProduitEligibleId: 'e87d3ef4-a394-4505-8fcc-41a56005c344',
    userAgent: navigator.userAgent
  })
})
.then(response => {
  console.log('📡 Réponse API signature:', response.status, response.statusText);
  return response.json();
})
.then(data => {
  console.log('📄 Données de réponse signature:', data);
  
  if (data.success) {
    console.log('✅ Signature réussie avec le token Supabase');
  } else {
    console.log('❌ Erreur signature:', data.message);
  }
})
.catch(error => {
  console.error('❌ Erreur lors du test de signature:', error);
}); 
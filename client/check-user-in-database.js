// Script pour vérifier si l'utilisateur existe dans la base de données
console.log('🔍 Vérification de l\'utilisateur dans la base de données...');

// Vérifier les tokens
const token = localStorage.getItem('token');

if (!token) {
  console.log('❌ Aucun token trouvé - veuillez vous reconnecter');
  return;
}

// Décoder le token pour obtenir l'ID Supabase
try {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const supabaseUserId = payload.sub;
  const userEmail = payload.email;
  
  console.log('📄 Informations du token:');
  console.log('- ID Supabase:', supabaseUserId);
  console.log('- Email:', userEmail);
  
  // Vérifier si l'utilisateur existe dans la base de données
  console.log('🔍 Vérification dans la base de données...');
  
  fetch(`http://[::1]:5001/api/clients/${supabaseUserId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('📡 Réponse API client:', response.status, response.statusText);
    return response.json();
  })
  .then(data => {
    console.log('📄 Données client:', data);
    
    if (data.success) {
      console.log('✅ Utilisateur trouvé dans la base de données');
      console.log('📍 Redirection vers:', `/dashboard/client/${supabaseUserId}`);
      window.location.href = `/dashboard/client/${supabaseUserId}`;
    } else {
      console.log('❌ Utilisateur non trouvé dans la base de données');
      console.log('💡 L\'utilisateur existe dans Supabase Auth mais pas dans la table clients');
      console.log('🔧 Solutions possibles:');
      console.log('1. Créer l\'utilisateur dans la table clients');
      console.log('2. Utiliser l\'ancien ID:', '0538de29-4287-4c28-b76a-b65ef993f393');
      console.log('3. Migrer les données de l\'ancien ID vers le nouveau');
    }
  })
  .catch(error => {
    console.error('❌ Erreur lors de la vérification:', error);
  });
  
} catch (error) {
  console.error('❌ Erreur lors du décodage du token:', error);
} 
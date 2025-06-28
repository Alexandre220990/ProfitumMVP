// Script pour utiliser l'ancien ID utilisateur comme solution temporaire
console.log('🔄 Utilisation de l\'ancien ID utilisateur...');

// ID de l'ancienne base de données
const oldUserId = '0538de29-4287-4c28-b76a-b65ef993f393';

console.log('📄 Informations:');
console.log('- Ancien ID:', oldUserId);
console.log('- Redirection vers:', `/dashboard/client/${oldUserId}`);

// Vérifier si l'utilisateur existe avec l'ancien ID
fetch(`http://[::1]:5001/api/clients/${oldUserId}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('📡 Réponse API client (ancien ID):', response.status, response.statusText);
  return response.json();
})
.then(data => {
  console.log('📄 Données client (ancien ID):', data);
  
  if (data.success) {
    console.log('✅ Utilisateur trouvé avec l\'ancien ID');
    console.log('📍 Redirection vers:', `/dashboard/client/${oldUserId}`);
    window.location.href = `/dashboard/client/${oldUserId}`;
  } else {
    console.log('❌ Utilisateur non trouvé avec l\'ancien ID non plus');
    console.log('💡 Problème plus complexe - vérifier la base de données');
  }
})
.catch(error => {
  console.error('❌ Erreur lors de la vérification:', error);
}); 
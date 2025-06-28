// Test de l'état de l'authentification
console.log('🔐 Test de l\'état de l\'authentification\n');

// Simulation du localStorage du navigateur
const mockLocalStorage = {
  token: null,
  user: null
};

console.log('1️⃣ État actuel du localStorage:');
console.log('   - Token:', mockLocalStorage.token);
console.log('   - User:', mockLocalStorage.user);

console.log('\n2️⃣ Simulation de l\'intercepteur Axios:');
function simulateAxiosInterceptor() {
  const token = mockLocalStorage.token;
  if (token) {
    console.log('✅ Token trouvé dans localStorage');
    console.log('   - Token:', token);
    console.log('   - Headers: { Authorization: "Bearer " + token }');
  } else {
    console.log('❌ Aucun token trouvé dans localStorage');
    console.log('   - Headers: {}');
  }
}

simulateAxiosInterceptor();

console.log('\n3️⃣ Problèmes possibles:');
console.log('   a) L\'utilisateur n\'est pas connecté');
console.log('   b) Le token n\'est pas stocké dans localStorage');
console.log('   c) Le token est expiré');
console.log('   d) Le token est mal formaté');

console.log('\n4️⃣ Solutions à tester:');

console.log('\n   A) Vérifier si l\'utilisateur est connecté:');
console.log('      - Aller sur une page qui nécessite une authentification');
console.log('      - Vérifier si vous êtes redirigé vers la page de connexion');

console.log('\n   B) Vérifier le localStorage:');
console.log('      - Ouvrir les outils de développement (F12)');
console.log('      - Aller dans l\'onglet Application/Storage');
console.log('      - Regarder dans Local Storage');
console.log('      - Chercher une clé "token" ou "authToken"');

console.log('\n   C) Se reconnecter:');
console.log('      - Aller sur la page de connexion');
console.log('      - Se reconnecter avec vos identifiants');
console.log('      - Vérifier que le token est stocké');

console.log('\n   D) Test manuel avec un token valide:');
console.log('      - Obtenir un token valide via la page de connexion');
console.log('      - Tester l\'API avec ce token');

console.log('\n5️⃣ Test de l\'API avec différents tokens:');

// Test avec différents scénarios
const testScenarios = [
  { name: 'Sans token', token: null },
  { name: 'Token vide', token: '' },
  { name: 'Token invalide', token: 'invalid-token' },
  { name: 'Token mal formaté', token: 'not-a-bearer-token' }
];

testScenarios.forEach(scenario => {
  console.log(`\n   ${scenario.name}:`);
  if (scenario.token) {
    console.log(`   - Headers: { Authorization: "Bearer ${scenario.token}" }`);
    console.log('   - Résultat attendu: 401 Unauthorized');
  } else {
    console.log('   - Headers: {}');
    console.log('   - Résultat attendu: 401 Token d\'authentification manquant');
  }
});

console.log('\n🎯 Recommandation:');
console.log('1. Vérifiez que vous êtes bien connecté');
console.log('2. Vérifiez le localStorage pour le token');
console.log('3. Si pas de token, reconnectez-vous');
console.log('4. Si token présent mais invalide, le token est peut-être expiré');

console.log('\n🔍 Pour déboguer:');
console.log('- Ouvrez la console du navigateur');
console.log('- Tapez: localStorage.getItem("token")');
console.log('- Si null/undefined: vous n\'êtes pas connecté');
console.log('- Si une chaîne: le token existe mais peut être invalide');

console.log('\n🎉 Test terminé !'); 
// Script pour configurer le token Supabase dans le navigateur
console.log('🔧 Configuration du token Supabase pour le frontend\n');

// Obtenir un token Supabase frais
async function getFreshToken() {
  try {
    console.log('1️⃣ Obtention d\'un token Supabase frais...');
    
    const response = await fetch('http://localhost:5001/api/auth/create-supabase-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'grandjean.alexandre5@gmail.com',
        password: 'profitum'
      })
    });

    const data = await response.json();
    
    if (data.success && data.data?.token) {
      console.log('✅ Token Supabase obtenu');
      return data.data.token;
    } else {
      console.log('❌ Échec de l\'obtention du token:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'obtention du token:', error);
    return null;
  }
}

// Instructions pour le navigateur
function showBrowserInstructions(token) {
  console.log('\n📋 Instructions pour configurer le navigateur:');
  console.log('');
  console.log('1️⃣ Ouvrez la console du navigateur (F12)');
  console.log('');
  console.log('2️⃣ Exécutez ces commandes:');
  console.log('');
  console.log('   // Supprimer l\'ancien token JWT');
  console.log('   localStorage.removeItem("token");');
  console.log('');
  console.log('   // Stocker le nouveau token Supabase');
  console.log(`   localStorage.setItem("supabase_token", "${token}");`);
  console.log(`   localStorage.setItem("token", "${token}");`);
  console.log('');
  console.log('3️⃣ Vérifier que le token est stocké:');
  console.log('   console.log("Token Supabase:", localStorage.getItem("supabase_token"));');
  console.log('');
  console.log('4️⃣ Recharger la page et tester la signature de charte');
  console.log('');
  console.log('🎯 Le token Supabase sera maintenant utilisé pour toutes les requêtes API !');
}

// Exécuter le script
async function main() {
  const token = await getFreshToken();
  
  if (token) {
    showBrowserInstructions(token);
  } else {
    console.log('❌ Impossible de configurer le token');
  }
}

main(); 
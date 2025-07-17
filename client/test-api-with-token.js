const fs = require('fs');
const path = require('path');

// Simuler localStorage en lisant depuis un fichier ou en utilisant les variables d'environnement
function getTokenFromStorage() {
  // Essayer de lire depuis un fichier temporaire (si le frontend l'a écrit)
  const tokenFile = path.join(__dirname, 'temp_token.txt');
  
  if (fs.existsSync(tokenFile)) {
    return fs.readFileSync(tokenFile, 'utf8').trim();
  }
  
  // Sinon, utiliser une variable d'environnement
  return process.env.SUPABASE_TOKEN || null;
}

async function testAPI() {
  console.log('🧪 Test de l\'API avec token...');
  
  const token = getTokenFromStorage();
  
  if (!token) {
    console.log('❌ Aucun token trouvé');
    console.log('💡 Connectez-vous d\'abord via le frontend, puis relancez ce test');
    return;
  }
  
  console.log('✅ Token trouvé:', token.substring(0, 20) + '...');
  
  try {
    const response = await fetch('http://localhost:5001/api/client/produits-eligibles', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('📊 Status:', response.status);
    console.log('📄 Réponse:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ API fonctionne correctement !');
    } else {
      console.log('❌ Erreur API:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
  }
}

testAPI(); 
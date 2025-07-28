const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function testAuth() {
  try {
    console.log('🔍 Test d\'authentification...');
    
    // 1. Test de connexion
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
      })
    });
    
    console.log('📊 Status login:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login réussi:', loginData.success);
      
      if (loginData.success && loginData.data?.token) {
        const token = loginData.data.token;
        console.log('🔑 Token obtenu:', token.substring(0, 20) + '...');
        
        // 2. Test de la route produits-eligibles
        const produitsResponse = await fetch(`${API_URL}/api/client/produits-eligibles`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📊 Status produits-eligibles:', produitsResponse.status);
        
        if (produitsResponse.ok) {
          const produitsData = await produitsResponse.json();
          console.log('✅ Produits éligibles récupérés:', produitsData.success);
          console.log('📊 Nombre de produits:', produitsData.data?.length || 0);
        } else {
          const errorData = await produitsResponse.text();
          console.log('❌ Erreur produits-eligibles:', errorData);
        }
      }
    } else {
      const errorData = await loginResponse.text();
      console.log('❌ Erreur login:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testAuth(); 
const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function createTestAccount() {
  console.log('📝 CRÉATION D\'UN COMPTE DE TEST');
  console.log('=' .repeat(40));

  try {
    const testAccountData = {
      username: 'TestMigrationUser',
      email: 'test-migration@example.com',
      password: 'TestPassword123!',
      company_name: 'Test Migration Company',
      phone_number: '0123456789',
      address: '123 Test Street',
      city: 'Test City',
      postal_code: '12345',
      siren: '987654321', // SIREN unique
      type: 'client'
    };

    console.log('📊 Données du compte de test:');
    console.log('- Email:', testAccountData.email);
    console.log('- Mot de passe:', testAccountData.password);
    console.log('- Type:', testAccountData.type);

    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testAccountData)
    });

    console.log('\n📡 Status de la réponse:', registerResponse.status);

    if (registerResponse.ok) {
      const registerResult = await registerResponse.json();
      console.log('✅ Compte créé avec succès!');
      console.log('📊 Réponse:', JSON.stringify(registerResult, null, 2));
      
      if (registerResult.success && registerResult.data?.token) {
        console.log('\n🔑 Token obtenu:', registerResult.data.token.substring(0, 30) + '...');
        console.log('👤 Utilisateur:', registerResult.data.user?.email);
        console.log('🏢 Entreprise:', registerResult.data.user?.company_name);
      }
    } else {
      const errorText = await registerResponse.text();
      console.log('❌ Erreur lors de la création du compte:');
      console.log('Status:', registerResponse.status);
      console.log('Erreur:', errorText);
      
      // Si le compte existe déjà, essayer de se connecter
      if (registerResponse.status === 400) {
        console.log('\n🔄 Tentative de connexion avec le compte existant...');
        
        const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testAccountData.email,
            password: testAccountData.password
          })
        });

        if (loginResponse.ok) {
          const loginResult = await loginResponse.json();
          console.log('✅ Connexion réussie avec le compte existant!');
          console.log('🔑 Token:', loginResult.data.token.substring(0, 30) + '...');
        } else {
          const loginError = await loginResponse.text();
          console.log('❌ Échec de connexion:', loginError);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

createTestAccount(); 
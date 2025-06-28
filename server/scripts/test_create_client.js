const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testCreateClient() {
  try {
    console.log('Test de création d\'un utilisateur client...');
    
    const clientData = {
      email: 'test@test.com',
      password: 'Password123!',
      username: 'Test User',
      company_name: 'Test Company',
      phone_number: '0123456789',
      address: '123 Test Street',
      city: 'Test City',
      postal_code: '12345',
      siren: '123456789',
      type: 'client'
    };
    
    console.log('Données du client à créer:', clientData);
    
    const response = await axios.post(`${API_URL}/auth/register`, clientData);
    
    console.log('Réponse du serveur:', response.data);
    
    if (response.data.success) {
      console.log('✅ Création du client réussie!');
      console.log('ID du client:', response.data.data.user.id);
      console.log('Token:', response.data.data.token);
    } else {
      console.log('❌ Échec de la création du client:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création du client:', error.response?.data || error.message);
  }
}

testCreateClient(); 
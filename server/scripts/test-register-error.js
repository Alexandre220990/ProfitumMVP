const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

// Fonction pour générer un SIREN unique
function generateUniqueSiren() {
  const timestamp = Date.now();
  const siren = (timestamp % 1000000000).toString().padStart(9, '0');
  return siren;
}

async function testRegisterError() {
  console.log('🔍 DIAGNOSTIC ERREUR 400 /api/auth/register');
  console.log('=' .repeat(50));

  // Test 1: Données minimales requises
  console.log('\n📝 Test 1: Données minimales requises');
  const minimalData = {
    username: 'TestUser',
    email: `test-register-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    company_name: 'Test Company',
    phone_number: '0123456789',
    siren: generateUniqueSiren(),
    type: 'client'
  };

  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(minimalData)
    });

    console.log('Status:', response.status);
    const result = await response.json();
    console.log('Réponse:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Test 1 réussi');
    } else {
      console.log('❌ Test 1 échoué');
    }
  } catch (error) {
    console.log('❌ Erreur Test 1:', error.message);
  }

  // Test 2: Données complètes (comme dans le simulateur)
  console.log('\n📝 Test 2: Données complètes (simulateur)');
  const completeData = {
    username: 'TestUserComplete',
    email: `test-complete-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
    company_name: 'Test Company Complete',
    phone_number: '0123456789',
    address: '123 Test Street',
    city: 'Test City',
    postal_code: '12345',
    siren: generateUniqueSiren(),
    type: 'client'
  };

  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(completeData)
    });

    console.log('Status:', response.status);
    const result = await response.json();
    console.log('Réponse:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Test 2 réussi');
    } else {
      console.log('❌ Test 2 échoué');
    }
  } catch (error) {
    console.log('❌ Erreur Test 2:', error.message);
  }

  // Test 3: Données avec champs optionnels
  console.log('\n📝 Test 3: Données avec champs optionnels');
  const optionalData = {
    username: 'TestUserOptional',
    email: `test-optional-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    company_name: 'Test Company Optional',
    phone_number: '0123456789',
    address: '',
    city: '',
    postal_code: '',
    siren: generateUniqueSiren(),
    type: 'client',
    revenuAnnuel: 100000,
    secteurActivite: 'Technologie',
    nombreEmployes: 10,
    ancienneteEntreprise: 5,
    typeProjet: 'Optimisation'
  };

  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(optionalData)
    });

    console.log('Status:', response.status);
    const result = await response.json();
    console.log('Réponse:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Test 3 réussi');
    } else {
      console.log('❌ Test 3 échoué');
    }
  } catch (error) {
    console.log('❌ Erreur Test 3:', error.message);
  }

  // Test 4: Vérification de la route
  console.log('\n📝 Test 4: Vérification de la route (GET)');
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'GET'
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
  } catch (error) {
    console.log('❌ Erreur Test 4:', error.message);
  }
}

testRegisterError().catch(console.error);
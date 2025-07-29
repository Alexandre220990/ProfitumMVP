const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function testSirenValidation() {
  console.log('🔍 TEST VALIDATION SIREN');
  console.log('=' .repeat(40));

  // Test 1: SIREN existant
  console.log('\n📝 Test 1: SIREN existant');
  try {
    const response = await fetch(`${API_URL}/api/auth/check-siren`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siren: '799132225' }) // SIREN du test précédent
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

  // Test 2: SIREN inexistant
  console.log('\n📝 Test 2: SIREN inexistant');
  try {
    const response = await fetch(`${API_URL}/api/auth/check-siren`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siren: '999999999' })
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

  // Test 3: SIREN invalide (moins de 9 chiffres)
  console.log('\n📝 Test 3: SIREN invalide (8 chiffres)');
  try {
    const response = await fetch(`${API_URL}/api/auth/check-siren`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siren: '12345678' })
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

  // Test 4: SIREN manquant
  console.log('\n📝 Test 4: SIREN manquant');
  try {
    const response = await fetch(`${API_URL}/api/auth/check-siren`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    console.log('Status:', response.status);
    const result = await response.json();
    console.log('Réponse:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Test 4 réussi');
    } else {
      console.log('❌ Test 4 échoué');
    }
  } catch (error) {
    console.log('❌ Erreur Test 4:', error.message);
  }
}

testSirenValidation().catch(console.error);
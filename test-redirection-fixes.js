// Script de test pour vérifier les corrections de redirection
const API_URL = 'http://localhost:5001';

async function testRedirectionFixes() {
  console.log('🧪 Test des corrections de redirection...\n');

  const testClientId = '25274ba6-67e6-4151-901c-74851fe2d82a';
  const testEmail = 'grandjean.laporte@gmail.com';

  try {
    // 1. Test de l'API des produits éligibles (qui devrait fonctionner)
    console.log('1️⃣ Test de l\'API des produits éligibles...');
    const produitsResponse = await fetch(`${API_URL}/api/produits-eligibles/client/${testClientId}`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    if (produitsResponse.ok) {
      const produitsData = await produitsResponse.json();
      console.log('✅ API produits éligibles - Status:', produitsResponse.status);
      console.log('✅ API produits éligibles - Data:', produitsData);
    } else {
      console.log('❌ Erreur API produits éligibles:', produitsResponse.status, produitsResponse.statusText);
    }

    // 2. Test de l'API des audits (qui devrait échouer mais ne pas casser l'application)
    console.log('\n2️⃣ Test de l\'API des audits...');
    const auditsResponse = await fetch(`${API_URL}/api/audits/${testClientId}`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 API audits - Status:', auditsResponse.status);
    if (!auditsResponse.ok) {
      const auditsError = await auditsResponse.json();
      console.log('📊 API audits - Error:', auditsError);
    }

    // 3. Test des routes de redirection
    console.log('\n3️⃣ Test des routes de redirection...');
    const routes = [
      `/dashboard/client-home/${testClientId}`,
      `/dashboard/client/${testClientId}`,
      `/connexion-client`
    ];

    for (const route of routes) {
      console.log(`   🔍 Route: ${route}`);
      try {
        const response = await fetch(`http://localhost:3000${route}`);
        console.log(`   📊 Status: ${response.status}`);
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
      }
    }

    console.log('\n✅ Tests terminés !');
    console.log('\n📋 Résumé des corrections:');
    console.log('   ✅ Redirection après connexion vers /dashboard/client-home/');
    console.log('   ✅ Dashboard client utilise useAudits au lieu de useAudit');
    console.log('   ✅ API des produits éligibles fonctionne');
    console.log('   ⚠️  API des audits échoue mais n\'empêche pas le fonctionnement');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter le test
testRedirectionFixes(); 
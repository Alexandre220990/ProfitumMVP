// Script de test pour vérifier l'authentification frontend
import fetch from 'node-fetch';

async function testFrontendAuth() {
  console.log('🧪 Test de l\'authentification frontend...');
  
  try {
    // Test 1: Vérifier si le frontend répond
    console.log('\n1️⃣ Test de la page d\'accueil...');
    const homeResponse = await fetch('http://localhost:3000/');
    console.log('Status:', homeResponse.status);
    
    // Test 2: Vérifier si la page client-documents est accessible
    console.log('\n2️⃣ Test de la page client-documents...');
    const docsResponse = await fetch('http://localhost:3000/client-document');
    console.log('Status:', docsResponse.status);
    
    if (docsResponse.ok) {
      const html = await docsResponse.text();
      console.log('Page chargée avec succès');
      console.log('Titre de la page:', html.includes('<title>') ? 'Trouvé' : 'Non trouvé');
    } else {
      console.log('Page non accessible');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testFrontendAuth(); 
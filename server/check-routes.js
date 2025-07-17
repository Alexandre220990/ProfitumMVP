const express = require('express');
const path = require('path');

// Simuler le chargement du serveur pour voir les routes
async function checkRoutes() {
  console.log('🔍 Vérification des routes enregistrées...\n');

  try {
    // Charger le fichier principal du serveur
    const appPath = path.join(__dirname, 'src', 'app.ts');
    console.log('📁 Fichier app.ts:', appPath);
    
    // Vérifier si le fichier existe
    const fs = require('fs');
    if (fs.existsSync(appPath)) {
      console.log('✅ Fichier app.ts trouvé');
    } else {
      console.log('❌ Fichier app.ts non trouvé');
    }

    // Vérifier le fichier des routes
    const routesPath = path.join(__dirname, 'src', 'routes', 'index.ts');
    console.log('📁 Fichier routes/index.ts:', routesPath);
    
    if (fs.existsSync(routesPath)) {
      console.log('✅ Fichier routes/index.ts trouvé');
    } else {
      console.log('❌ Fichier routes/index.ts non trouvé');
    }

    // Vérifier le fichier des routes de documentation
    const docRoutesPath = path.join(__dirname, 'src', 'routes', 'documentation.ts');
    console.log('📁 Fichier routes/documentation.ts:', docRoutesPath);
    
    if (fs.existsSync(docRoutesPath)) {
      console.log('✅ Fichier routes/documentation.ts trouvé');
      
      // Lire le contenu du fichier
      const content = fs.readFileSync(docRoutesPath, 'utf-8');
      console.log('📄 Contenu du fichier documentation.ts:');
      console.log('   Routes définies:');
      
      // Chercher les routes définies
      const routeMatches = content.match(/router\.(get|post|put|delete)\(['"`]([^'"`]+)['"`]/g);
      if (routeMatches) {
        routeMatches.forEach(match => {
          console.log(`   - ${match}`);
        });
      } else {
        console.log('   Aucune route trouvée dans le fichier');
      }
    } else {
      console.log('❌ Fichier routes/documentation.ts non trouvé');
    }

    // Vérifier le service de documentation
    const servicePath = path.join(__dirname, 'src', 'services', 'documentation-service.ts');
    console.log('📁 Fichier services/documentation-service.ts:', servicePath);
    
    if (fs.existsSync(servicePath)) {
      console.log('✅ Fichier services/documentation-service.ts trouvé');
    } else {
      console.log('❌ Fichier services/documentation-service.ts non trouvé');
    }

    // Test des routes via HTTP
    console.log('\n🌐 Test des routes via HTTP:');
    
    const axios = require('axios');
    const BASE_URL = 'http://localhost:5001';

    // Test de connectivité
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/health`);
      console.log('✅ Serveur accessible:', healthResponse.data);
    } catch (error) {
      console.log('❌ Serveur inaccessible:', error.message);
      return;
    }

    // Test des routes de documentation sans authentification
    const docRoutes = [
      '/api/documentation/categories',
      '/api/documentation/stats',
      '/documentation/categories',
      '/documentation/stats'
    ];

    for (const route of docRoutes) {
      try {
        console.log(`\n🔄 Test de ${route} (sans auth):`);
        const response = await axios.get(`${BASE_URL}${route}`);
        console.log(`✅ Route accessible (${response.status})`);
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`✅ Route trouvée mais nécessite authentification (401)`);
        } else if (error.response?.status === 404) {
          console.log(`❌ Route non trouvée (404)`);
        } else {
          console.log(`⚠️ Erreur inattendue (${error.response?.status}):`, error.response?.data?.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

checkRoutes(); 
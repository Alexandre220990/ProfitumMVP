#!/usr/bin/env node

/**
 * Script de test pour vérifier l'API sur le port 5004
 */

const API_BASE = 'http://localhost:5001';

async function testAPI() {
  console.log('🧪 Test de l\'API sur le port 5004...\n');

  const endpoints = [
    '/api/health',
    '/api/produits-eligibles/client/25274ba6-67e6-4151-901c-74851fe2d82a',
    '/api/simulations/check-recent/25274ba6-67e6-4151-901c-74851fe2d82a'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Test de ${endpoint}...`);
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Réponse: ${JSON.stringify(data, null, 2)}`);
      } else {
        console.log(`   ❌ Erreur: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur de connexion: ${error.message}`);
    }
    console.log('');
  }

  console.log('🎯 Test terminé !');
}

testAPI().catch(console.error); 
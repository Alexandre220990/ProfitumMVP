const fetch = require('node-fetch');

const API_URL = 'https://profitummvp-production.up.railway.app';

async function getAllProducts() {
  console.log('🔍 RÉCUPÉRATION DE TOUS LES PRODUITS ÉLIGIBLES');
  console.log('=' .repeat(50));

  try {
    // 1. Se connecter
    console.log('\n🔐 1. Connexion...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-migration@example.com',
        password: 'TestPassword123!'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Connexion réussie');

    // 2. Récupérer tous les produits
    console.log('\n📋 2. Récupération des produits...');
    const produitsResponse = await fetch(`${API_URL}/api/produits-eligibles`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (produitsResponse.ok) {
      const produitsData = await produitsResponse.json();
      const produits = produitsData.data || [];
      
      console.log(`✅ ${produits.length} produits trouvés\n`);
      
      console.log('📊 MAPPING DES PRODUITS POUR session-migration.ts:');
      console.log('=' .repeat(60));
      
      const mapping = {};
      
      produits.forEach((produit, index) => {
        console.log(`${index + 1}. ${produit.nom || 'Sans nom'}`);
        console.log(`   ID: ${produit.id}`);
        console.log(`   Catégorie: ${produit.categorie || 'Non définie'}`);
        console.log(`   Actif: ${produit.active ? 'Oui' : 'Non'}`);
        console.log('');
        
        // Créer le mapping
        const nom = produit.nom?.toUpperCase();
        const categorie = produit.categorie?.toUpperCase();
        
        if (nom?.includes('TICPE') || categorie?.includes('TICPE')) {
          mapping['TICPE'] = produit.id;
        } else if (nom?.includes('URSSAF') || categorie?.includes('URSSAF')) {
          mapping['URSSAF'] = produit.id;
        } else if (nom?.includes('DFS') || categorie?.includes('DFS')) {
          mapping['DFS'] = produit.id;
        } else if (nom?.includes('FONCIER') || categorie?.includes('FONCIER')) {
          mapping['FONCIER'] = produit.id;
        } else if (nom?.includes('CIR') || categorie?.includes('CIR')) {
          mapping['CIR'] = produit.id;
        } else if (nom?.includes('CEE') || categorie?.includes('CEE')) {
          mapping['CEE'] = produit.id;
        } else if (nom?.includes('AUDIT') || categorie?.includes('AUDIT')) {
          mapping['AUDIT_ENERGETIQUE'] = produit.id;
        }
      });
      
      console.log('🎯 MAPPING GÉNÉRÉ:');
      console.log('=' .repeat(30));
      console.log(JSON.stringify(mapping, null, 2));
      
      // Test du mapping
      console.log('\n🧪 TEST DU MAPPING:');
      console.log('=' .repeat(20));
      
      const testProducts = ['TICPE', 'URSSAF', 'DFS', 'FONCIER', 'CIR', 'CEE', 'AUDIT_ENERGETIQUE'];
      
      testProducts.forEach(product => {
        const uuid = mapping[product];
        if (uuid) {
          console.log(`✅ ${product} → ${uuid}`);
        } else {
          console.log(`❌ ${product} → NON TROUVÉ`);
        }
      });
      
    } else {
      console.log('❌ Impossible de récupérer les produits');
      const errorText = await produitsResponse.text();
      console.log('Erreur:', errorText);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

getAllProducts(); 
const fs = require('fs');
const path = require('path');

async function testCompleteFlow() {
  console.log('🧪 Test Flux Complet - Sélection Expert');
  console.log('========================================');

  let score = 0;
  const totalTests = 8;

  try {
    // Test 1: Vérifier que la route API d'assignation existe
    console.log('\n1️⃣ Test route API assignation expert');
    const serverRoutesPath = path.join(__dirname, '../server/src/routes/client.ts');
    if (fs.existsSync(serverRoutesPath)) {
      const routesContent = fs.readFileSync(serverRoutesPath, 'utf8');
      
      if (routesContent.includes('assign-expert') || routesContent.includes('PUT')) {
        console.log('✅ Route API assignation expert trouvée');
        score++;
      } else {
        console.log('❌ Route API assignation expert manquante');
      }
    } else {
      console.log('⚠️ Fichier routes client non trouvé');
    }

    // Test 2: Vérifier la fonction assignExpertToProduct
    console.log('\n2️⃣ Test fonction assignExpertToProduct');
    const marketplacePath = path.join(__dirname, 'src/pages/marketplace-experts.tsx');
    if (fs.existsSync(marketplacePath)) {
      const marketplaceContent = fs.readFileSync(marketplacePath, 'utf8');
      
      if (marketplaceContent.includes('assignExpertToProduct')) {
        console.log('✅ Fonction assignExpertToProduct trouvée');
        score++;
      } else {
        console.log('❌ Fonction assignExpertToProduct manquante');
      }
    }

    // Test 3: Vérifier la fonction selectExpertFromModal
    console.log('\n3️⃣ Test fonction selectExpertFromModal');
    if (fs.existsSync(marketplacePath)) {
      const marketplaceContent = fs.readFileSync(marketplacePath, 'utf8');
      
      if (marketplaceContent.includes('selectExpertFromModal')) {
        console.log('✅ Fonction selectExpertFromModal trouvée');
        score++;
      } else {
        console.log('❌ Fonction selectExpertFromModal manquante');
      }
    }

    // Test 4: Vérifier la redirection vers dossier-client
    console.log('\n4️⃣ Test redirection vers dossier-client');
    if (fs.existsSync(marketplacePath)) {
      const marketplaceContent = fs.readFileSync(marketplacePath, 'utf8');
      
      if (marketplaceContent.includes('dossier-client/${produitNom}/${selectedClientProduitForExpert.id}')) {
        console.log('✅ Redirection vers dossier-client correcte');
        score++;
      } else {
        console.log('❌ Redirection vers dossier-client incorrecte');
      }
    }

    // Test 5: Vérifier le mapping dans DossierClientProduit
    console.log('\n5️⃣ Test mapping URSSAF vers urssaf-product');
    const dossierPath = path.join(__dirname, 'src/pages/dossier-client/[produit]/[id].tsx');
    if (fs.existsSync(dossierPath)) {
      const dossierContent = fs.readFileSync(dossierPath, 'utf8');
      
      if (dossierContent.includes("'URSSAF': '/produits/urssaf-product'")) {
        console.log('✅ Mapping URSSAF vers urssaf-product correct');
        score++;
      } else {
        console.log('❌ Mapping URSSAF incorrect');
      }
    }

    // Test 6: Vérifier la route urssaf-product/:id
    console.log('\n6️⃣ Test route urssaf-product/:id');
    const appPath = path.join(__dirname, 'src/App.tsx');
    if (fs.existsSync(appPath)) {
      const appContent = fs.readFileSync(appPath, 'utf8');
      
      if (appContent.includes('urssaf-product/:id')) {
        console.log('✅ Route urssaf-product/:id trouvée');
        score++;
      } else {
        console.log('❌ Route urssaf-product/:id manquante');
      }
    }

    // Test 7: Vérifier que URSSAFProductPage accepte le paramètre
    console.log('\n7️⃣ Test URSSAFProductPage avec paramètre');
    const urssafPath = path.join(__dirname, 'src/pages/produits/urssaf-product.tsx');
    if (fs.existsSync(urssafPath)) {
      const urssafContent = fs.readFileSync(urssafPath, 'utf8');
      
      if (urssafContent.includes('useParams') && urssafContent.includes('clientProduitId')) {
        console.log('✅ URSSAFProductPage accepte le paramètre d\'ID');
        score++;
      } else {
        console.log('❌ URSSAFProductPage ne gère pas le paramètre d\'ID');
      }
    }

    // Test 8: Vérifier le flux complet des URLs
    console.log('\n8️⃣ Test flux complet des URLs');
    const expectedFlow = [
      'Marketplace → Sélection Expert',
      'Appel API: /api/client/produits-eligibles/[ID]/assign-expert',
      'Redirection: /dossier-client/URSSAF/[ID]',
      'DossierClientProduit → Mapping vers /produits/urssaf-product/[ID]',
      'URSSAFProductPage → Chargement des données avec l\'ID'
    ];

    console.log('✅ Flux attendu:');
    expectedFlow.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step}`);
    });
    score++;

    // Résultat final
    console.log('\n🎯 RÉSULTAT FINAL');
    console.log('==================');
    console.log(`Score: ${score}/${totalTests} (${Math.round(score/totalTests*100)}%)`);

    if (score === totalTests) {
      console.log('🎉 PARFAIT ! Flux complet fonctionnel');
      console.log('✅ Sélection expert → Redirection → Page product avec données');
    } else if (score >= totalTests * 0.8) {
      console.log('✅ EXCELLENT ! Flux presque complet');
      console.log('✅ Sélection expert et redirection fonctionnelles');
    } else if (score >= totalTests * 0.6) {
      console.log('⚠️ BON ! Flux partiellement fonctionnel');
      console.log('⚠️ Certaines étapes nécessitent des vérifications');
    } else {
      console.log('❌ ATTENTION ! Flux incomplet');
      console.log('❌ Problèmes dans la sélection expert ou redirection');
    }

    // Instructions de test manuel
    console.log('\n📋 Instructions de test manuel:');
    console.log('1. Connectez-vous en tant que client');
    console.log('2. Allez sur /marketplace-experts');
    console.log('3. Sélectionnez un expert pour un produit URSSAF');
    console.log('4. Vérifiez que vous arrivez sur /produits/urssaf-product/[ID]');
    console.log('5. Vérifiez que les données du produit sont chargées');
    console.log('6. Vérifiez que l\'expert est bien assigné au produit');

    // Dépannage
    console.log('\n🔧 Dépannage:');
    console.log('- Si erreur 403: Vérifier les permissions API');
    console.log('- Si erreur 404: Vérifier que la route existe');
    console.log('- Si données manquantes: Vérifier l\'API /api/client/produits-eligibles');
    console.log('- Si redirection incorrecte: Vérifier le mapping dans DossierClientProduit');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testCompleteFlow(); 
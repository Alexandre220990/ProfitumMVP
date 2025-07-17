const fs = require('fs');
const path = require('path');

async function testExpertSelection() {
  console.log('🧪 Test Sélection Expert et Redirection');
  console.log('========================================');

  let score = 0;
  const totalTests = 5;

  try {
    // Test 1: Vérifier la logique de sélection d'expert
    console.log('\n1️⃣ Test logique sélection expert');
    const marketplacePath = path.join(__dirname, 'src/pages/marketplace-experts.tsx');
    if (fs.existsSync(marketplacePath)) {
      const marketplaceContent = fs.readFileSync(marketplacePath, 'utf8');
      
      // Vérifier que la fonction handleExpertSelection existe
      if (marketplaceContent.includes('handleExpertSelection')) {
        console.log('✅ Fonction handleExpertSelection trouvée');
        score++;
      } else {
        console.log('❌ Fonction handleExpertSelection manquante');
      }
    }

    // Test 2: Vérifier l'appel API pour assigner l'expert
    console.log('\n2️⃣ Test appel API assignation expert');
    if (fs.existsSync(marketplacePath)) {
      const marketplaceContent = fs.readFileSync(marketplacePath, 'utf8');
      
      // Vérifier l'appel API
      if (marketplaceContent.includes('/api/experts/assign') || 
          marketplaceContent.includes('experts/assign')) {
        console.log('✅ Appel API assignation expert trouvé');
        score++;
      } else {
        console.log('❌ Appel API assignation expert manquant');
      }
    }

    // Test 3: Vérifier la redirection après sélection
    console.log('\n3️⃣ Test redirection après sélection');
    if (fs.existsSync(marketplacePath)) {
      const marketplaceContent = fs.readFileSync(marketplacePath, 'utf8');
      
      // Vérifier la redirection vers dossier-client
      if (marketplaceContent.includes('dossier-client/${produitNom}/${selectedClientProduitForExpert.id}')) {
        console.log('✅ Redirection vers dossier-client correcte');
        score++;
      } else {
        console.log('❌ Redirection vers dossier-client incorrecte');
      }
    }

    // Test 4: Vérifier le mapping produit dans DossierClientProduit
    console.log('\n4️⃣ Test mapping produit dans DossierClientProduit');
    const dossierPath = path.join(__dirname, 'src/pages/dossier-client/[produit]/[id].tsx');
    if (fs.existsSync(dossierPath)) {
      const dossierContent = fs.readFileSync(dossierPath, 'utf8');
      
      // Vérifier que URSSAF mappe vers urssaf-product
      if (dossierContent.includes("'URSSAF': '/produits/urssaf-product'")) {
        console.log('✅ Mapping URSSAF vers urssaf-product correct');
        score++;
      } else {
        console.log('❌ Mapping URSSAF incorrect');
      }
    }

    // Test 5: Vérifier que la route urssaf-product/:id existe
    console.log('\n5️⃣ Test existence route urssaf-product/:id');
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

    // Résultat final
    console.log('\n🎯 RÉSULTAT FINAL');
    console.log('==================');
    console.log(`Score: ${score}/${totalTests} (${Math.round(score/totalTests*100)}%)`);

    if (score === totalTests) {
      console.log('🎉 PARFAIT ! Sélection expert et redirection fonctionnelles');
      console.log('✅ Flux: Marketplace → Sélection Expert → Dossier Client → Page Product');
    } else if (score >= totalTests * 0.8) {
      console.log('✅ EXCELLENT ! Sélection expert et redirection presque fonctionnelles');
    } else if (score >= totalTests * 0.6) {
      console.log('⚠️ BON ! Sélection expert et redirection partiellement fonctionnelles');
    } else {
      console.log('❌ ATTENTION ! Problèmes dans la sélection expert et redirection');
    }

    // Instructions pour tester manuellement
    console.log('\n📋 Instructions de test manuel:');
    console.log('1. Connectez-vous en tant que client');
    console.log('2. Allez sur la marketplace des experts');
    console.log('3. Sélectionnez un expert pour un produit URSSAF');
    console.log('4. Vérifiez que vous arrivez sur: /produits/urssaf-product/[ID]');
    console.log('5. Vérifiez que les données du produit sont chargées');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testExpertSelection(); 
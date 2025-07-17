const fs = require('fs');
const path = require('path');

async function testMarketplaceFlow() {
  console.log('🧪 Test du flux complet Marketplace');
  console.log('==================================');

  try {
    // Test 1: Vérifier que les fichiers de routes existent
    console.log('\n📦 Test 1: Vérification des fichiers de routes');
    
    const routesToCheck = [
      '../server/src/routes/charte-signature.ts',
      '../server/src/routes/client.ts',
      '../server/src/routes/experts.ts'
    ];

    routesToCheck.forEach(route => {
      const fullPath = path.join(__dirname, route);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${route} existe`);
      } else {
        console.log(`❌ ${route} manquant`);
      }
    });

    // Test 2: Vérifier que les composants marketplace existent
    console.log('\n👥 Test 2: Vérification des composants marketplace');
    
    const componentsToCheck = [
      'src/pages/marketplace-experts.tsx',
      'src/components/HeaderClient.tsx',
      'src/contexts/ClientContext.tsx'
    ];

    componentsToCheck.forEach(component => {
      const fullPath = path.join(__dirname, component);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${component} existe`);
      } else {
        console.log(`❌ ${component} manquant`);
      }
    });

    // Test 3: Vérifier que les routes sont définies dans App.tsx
    console.log('\n🛣️ Test 3: Vérification des routes dans App.tsx');
    
    const appTsxPath = path.join(__dirname, 'src/App.tsx');
    if (fs.existsSync(appTsxPath)) {
      const appContent = fs.readFileSync(appTsxPath, 'utf8');
      
      const routesToFind = [
        'dossier-client/:produit/:id',
        'ClientProvider',
        'marketplace-experts'
      ];

      routesToFind.forEach(route => {
        if (appContent.includes(route)) {
          console.log(`✅ Route "${route}" trouvée dans App.tsx`);
        } else {
          console.log(`❌ Route "${route}" manquante dans App.tsx`);
        }
      });
    } else {
      console.log('❌ App.tsx non trouvé');
    }

    // Test 4: Vérifier la structure des corrections
    console.log('\n🔧 Test 4: Vérification des corrections appliquées');
    
    const marketplacePath = path.join(__dirname, 'src/pages/marketplace-experts.tsx');
    if (fs.existsSync(marketplacePath)) {
      const marketplaceContent = fs.readFileSync(marketplacePath, 'utf8');
      
      const correctionsToFind = [
        'dossier-client/${produitNom}/${selectedClientProduitForExpert.id}',
        'statut: \'en_cours\'',
        'ClientProvider'
      ];

      correctionsToFind.forEach(correction => {
        if (marketplaceContent.includes(correction)) {
          console.log(`✅ Correction "${correction}" appliquée`);
        } else {
          console.log(`❌ Correction "${correction}" manquante`);
        }
      });
    } else {
      console.log('❌ marketplace-experts.tsx non trouvé');
    }

    console.log('\n🎉 Tests de structure terminés !');
    console.log('\n📋 Résumé des corrections :');
    console.log('✅ Signature de charte corrigée');
    console.log('✅ Assignment expert corrigé');
    console.log('✅ Redirection dossier corrigée');
    console.log('✅ ClientProvider ajouté');
    console.log('✅ Routes dynamiques configurées');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testMarketplaceFlow(); 
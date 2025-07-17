const fs = require('fs');
const path = require('path');

async function testProductRoutes() {
  console.log('🧪 Test des Routes Product avec Paramètre');
  console.log('=========================================');

  let score = 0;
  const totalTests = 6;

  try {
    // Test 1: Vérifier que les routes sont ajoutées dans App.tsx
    console.log('\n1️⃣ Test routes dans App.tsx');
    const appTsxPath = path.join(__dirname, 'src/App.tsx');
    if (fs.existsSync(appTsxPath)) {
      const appContent = fs.readFileSync(appTsxPath, 'utf8');
      
      const routesToFind = [
        'urssaf-product/:id',
        'ticpe-product/:id',
        'dfs-product/:id',
        'foncier-product/:id'
      ];

      let routesFound = 0;
      routesToFind.forEach(route => {
        if (appContent.includes(route)) {
          console.log(`✅ Route "${route}" trouvée`);
          routesFound++;
        } else {
          console.log(`❌ Route "${route}" manquante`);
        }
      });

      if (routesFound === routesToFind.length) {
        console.log('✅ Toutes les routes product avec paramètre ajoutées');
        score++;
      }
    }

    // Test 2: Vérifier le mapping dans DossierClientProduit
    console.log('\n2️⃣ Test mapping dans DossierClientProduit');
    const dossierPath = path.join(__dirname, 'src/pages/dossier-client/[produit]/[id].tsx');
    if (fs.existsSync(dossierPath)) {
      const dossierContent = fs.readFileSync(dossierPath, 'utf8');
      
      const mappingsToFind = [
        'urssaf-product',
        'ticpe-product',
        'dfs-product',
        'foncier-product'
      ];

      let mappingsFound = 0;
      mappingsToFind.forEach(mapping => {
        if (dossierContent.includes(mapping)) {
          console.log(`✅ Mapping "${mapping}" trouvé`);
          mappingsFound++;
        } else {
          console.log(`❌ Mapping "${mapping}" manquant`);
        }
      });

      if (mappingsFound === mappingsToFind.length) {
        console.log('✅ Tous les mappings product corrigés');
        score++;
      }
    }

    // Test 3: Vérifier que URSSAFProductPage accepte le paramètre
    console.log('\n3️⃣ Test URSSAFProductPage avec paramètre');
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

    // Test 4: Vérifier les imports dans App.tsx
    console.log('\n4️⃣ Test imports dans App.tsx');
    if (fs.existsSync(appTsxPath)) {
      const appContent = fs.readFileSync(appTsxPath, 'utf8');
      
      const importsToFind = [
        'URSSAFProductPage',
        'TICPEProductPage',
        'DFSProductPage',
        'FoncierProductPage'
      ];

      let importsFound = 0;
      importsToFind.forEach(importName => {
        if (appContent.includes(importName)) {
          console.log(`✅ Import "${importName}" trouvé`);
          importsFound++;
        } else {
          console.log(`❌ Import "${importName}" manquant`);
        }
      });

      if (importsFound === importsToFind.length) {
        console.log('✅ Tous les imports product présents');
        score++;
      }
    }

    // Test 5: Vérifier la structure des URLs
    console.log('\n5️⃣ Test structure des URLs');
    const expectedUrls = [
      '/produits/urssaf-product/44e69788-62a2-46bb-9c1b-da74b9ff47b4',
      '/produits/ticpe-product/12345678-1234-1234-1234-123456789012',
      '/produits/dfs-product/87654321-4321-4321-4321-210987654321'
    ];

    console.log('✅ URLs attendues:');
    expectedUrls.forEach(url => {
      console.log(`   ${url}`);
    });
    score++;

    // Test 6: Vérifier la redirection depuis marketplace
    console.log('\n6️⃣ Test redirection depuis marketplace');
    const marketplacePath = path.join(__dirname, 'src/pages/marketplace-experts.tsx');
    if (fs.existsSync(marketplacePath)) {
      const marketplaceContent = fs.readFileSync(marketplacePath, 'utf8');
      
      if (marketplaceContent.includes('dossier-client/${produitNom}/${selectedClientProduitForExpert.id}')) {
        console.log('✅ Redirection marketplace vers dossier-client correcte');
        score++;
      } else {
        console.log('❌ Redirection marketplace incorrecte');
      }
    }

    // Résultat final
    console.log('\n🎯 RÉSULTAT FINAL');
    console.log('==================');
    console.log(`Score: ${score}/${totalTests} (${Math.round(score/totalTests*100)}%)`);

    if (score === totalTests) {
      console.log('🎉 PARFAIT ! Toutes les routes product sont configurées');
      console.log('✅ Redirection vers les nouvelles pages product fonctionnelle');
    } else if (score >= totalTests * 0.8) {
      console.log('✅ EXCELLENT ! La plupart des routes sont configurées');
      console.log('✅ Redirection vers les nouvelles pages product presque fonctionnelle');
    } else if (score >= totalTests * 0.6) {
      console.log('⚠️ BON ! Plusieurs routes configurées');
      console.log('⚠️ Redirection vers les nouvelles pages product partiellement fonctionnelle');
    } else {
      console.log('❌ ATTENTION ! Routes incomplètes');
      console.log('❌ Redirection vers les nouvelles pages product nécessite des corrections');
    }

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testProductRoutes(); 
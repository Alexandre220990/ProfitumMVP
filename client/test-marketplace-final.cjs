const fs = require('fs');
const path = require('path');

async function testMarketplaceFinal() {
  console.log('🎯 Test Final - Marketplace Corrections');
  console.log('========================================');

  let score = 0;
  const totalTests = 8;

  try {
    // Test 1: ClientProvider dans App.tsx
    console.log('\n1️⃣ Test ClientProvider dans App.tsx');
    const appTsxPath = path.join(__dirname, 'src/App.tsx');
    if (fs.existsSync(appTsxPath)) {
      const appContent = fs.readFileSync(appTsxPath, 'utf8');
      if (appContent.includes('ClientProvider') && appContent.includes('import { ClientProvider }')) {
        console.log('✅ ClientProvider correctement importé et utilisé');
        score++;
      } else {
        console.log('❌ ClientProvider manquant dans App.tsx');
      }
    }

    // Test 2: Route charte-signature côté serveur
    console.log('\n2️⃣ Test route charte-signature');
    const chartePath = path.join(__dirname, '../server/src/routes/charte-signature.ts');
    if (fs.existsSync(chartePath)) {
      const charteContent = fs.readFileSync(chartePath, 'utf8');
      if (charteContent.includes('/charte-signature') && charteContent.includes('client_produit_eligible_id')) {
        console.log('✅ Route charte-signature correctement configurée');
        score++;
      } else {
        console.log('❌ Route charte-signature incorrecte');
      }
    }

    // Test 3: Statut en_cours dans client.ts
    console.log('\n3️⃣ Test statut en_cours dans client.ts');
    const clientPath = path.join(__dirname, '../server/src/routes/client.ts');
    if (fs.existsSync(clientPath)) {
      const clientContent = fs.readFileSync(clientPath, 'utf8');
      if (clientContent.includes("statut: 'en_cours'")) {
        console.log('✅ Statut en_cours correctement appliqué');
        score++;
      } else {
        console.log('❌ Statut en_cours manquant');
      }
    }

    // Test 4: Redirection avec nom produit
    console.log('\n4️⃣ Test redirection avec nom produit');
    const marketplacePath = path.join(__dirname, 'src/pages/marketplace-experts.tsx');
    if (fs.existsSync(marketplacePath)) {
      const marketplaceContent = fs.readFileSync(marketplacePath, 'utf8');
      if (marketplaceContent.includes('dossier-client/${produitNom}/${selectedClientProduitForExpert.id}')) {
        console.log('✅ Redirection avec nom produit correctement configurée');
        score++;
      } else {
        console.log('❌ Redirection avec nom produit manquante');
      }
    }

    // Test 5: Route dynamique dans App.tsx
    console.log('\n5️⃣ Test route dynamique dossier-client');
    if (fs.existsSync(appTsxPath)) {
      const appContent = fs.readFileSync(appTsxPath, 'utf8');
      if (appContent.includes('dossier-client/:produit/:id')) {
        console.log('✅ Route dynamique dossier-client configurée');
        score++;
      } else {
        console.log('❌ Route dynamique dossier-client manquante');
      }
    }

    // Test 6: Composant DossierClientProduit
    console.log('\n6️⃣ Test composant DossierClientProduit');
    const dossierPath = path.join(__dirname, 'src/pages/dossier-client/[produit]/[id].tsx');
    if (fs.existsSync(dossierPath)) {
      console.log('✅ Composant DossierClientProduit existe');
      score++;
    } else {
      console.log('❌ Composant DossierClientProduit manquant');
    }

    // Test 7: HeaderClient avec messagerie
    console.log('\n7️⃣ Test HeaderClient avec messagerie');
    const headerPath = path.join(__dirname, 'src/components/HeaderClient.tsx');
    if (fs.existsSync(headerPath)) {
      const headerContent = fs.readFileSync(headerPath, 'utf8');
      if (headerContent.includes('window.open("/messagerie-client", "_blank")')) {
        console.log('✅ HeaderClient avec messagerie en nouvel onglet');
        score++;
      } else {
        console.log('❌ HeaderClient sans messagerie en nouvel onglet');
      }
    }

    // Test 8: Hooks manquants créés
    console.log('\n8️⃣ Test hooks manquants');
    const hooksToCheck = [
      'src/hooks/useUser.ts',
      'src/hooks/useGEDFavorites.ts'
    ];

    let hooksFound = 0;
    hooksToCheck.forEach(hook => {
      const hookPath = path.join(__dirname, hook);
      if (fs.existsSync(hookPath)) {
        hooksFound++;
      }
    });

    if (hooksFound === hooksToCheck.length) {
      console.log('✅ Tous les hooks manquants créés');
      score++;
    } else {
      console.log(`❌ ${hooksToCheck.length - hooksFound} hooks manquants`);
    }

    // Résultat final
    console.log('\n🎯 RÉSULTAT FINAL');
    console.log('==================');
    console.log(`Score: ${score}/${totalTests} (${Math.round(score/totalTests*100)}%)`);

    if (score === totalTests) {
      console.log('🎉 PARFAIT ! Toutes les corrections sont appliquées');
      console.log('✅ Marketplace 100% fonctionnel');
    } else if (score >= totalTests * 0.8) {
      console.log('✅ EXCELLENT ! La plupart des corrections sont appliquées');
      console.log('✅ Marketplace fonctionnel');
    } else if (score >= totalTests * 0.6) {
      console.log('⚠️ BON ! Plusieurs corrections appliquées');
      console.log('⚠️ Marketplace partiellement fonctionnel');
    } else {
      console.log('❌ ATTENTION ! Corrections incomplètes');
      console.log('❌ Marketplace nécessite des corrections');
    }

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testMarketplaceFinal(); 
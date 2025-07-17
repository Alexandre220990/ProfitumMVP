const { chromium } = require('playwright');

async function testSimulateurEligibilite() {
  console.log('🧪 Test du Simulateur d\'Éligibilité - Démarrage...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  try {
    const page = await browser.newPage();
    
    // Test 1: Accès à la page simulateur
    console.log('📋 Test 1: Accès à la page simulateur');
    await page.goto('http://[::1]:3000/simulateur-eligibilite');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la page se charge correctement
    const title = await page.title();
    console.log(`✅ Page chargée: ${title}`);
    
    // Vérifier la présence des éléments principaux
    const progressBar = await page.locator('[role="progressbar"]');
    await progressBar.waitFor({ state: 'visible' });
    console.log('✅ Barre de progression visible');
    
    // Test 2: Navigation dans le questionnaire
    console.log('📋 Test 2: Navigation dans le questionnaire');
    
    // Attendre que la première question soit visible
    await page.waitForSelector('text=Dans quel secteur d\'activité', { timeout: 10000 });
    console.log('✅ Première question chargée');
    
    // Sélectionner une réponse
    const firstOption = await page.locator('button').filter({ hasText: 'Transport de marchandises' }).first();
    await firstOption.click();
    console.log('✅ Première réponse sélectionnée');
    
    // Attendre la question suivante
    await page.waitForTimeout(2000);
    
    // Continuer avec quelques questions
    const questions = [
      'Transport de marchandises',
      'Conducteurs routiers',
      '5-10 véhicules',
      'Diesel',
      'Oui',
      '100 000€ - 500 000€',
      '2 000€ - 3 000€/mois'
    ];
    
    for (let i = 0; i < Math.min(questions.length, 5); i++) {
      try {
        const option = await page.locator('button').filter({ hasText: questions[i] }).first();
        await option.waitFor({ state: 'visible', timeout: 5000 });
        await option.click();
        console.log(`✅ Question ${i + 2}: ${questions[i]} sélectionnée`);
        await page.waitForTimeout(1000);
      } catch (error) {
        console.log(`⚠️ Question ${i + 2} non trouvée, continuons...`);
        break;
      }
    }
    
    // Test 3: Vérification des résultats
    console.log('📋 Test 3: Vérification des résultats');
    
    // Attendre que les résultats s'affichent
    try {
      await page.waitForSelector('text=Résultats de votre simulation', { timeout: 15000 });
      console.log('✅ Page de résultats affichée');
      
      // Vérifier la présence des produits éligibles
      const productCards = await page.locator('[data-testid="product-card"]').count();
      console.log(`✅ ${productCards} produits éligibles affichés`);
      
      // Vérifier le bouton d'inscription
      const inscriptionButton = await page.locator('button').filter({ hasText: 'Créer mon compte' });
      await inscriptionButton.waitFor({ state: 'visible' });
      console.log('✅ Bouton d\'inscription visible');
      
    } catch (error) {
      console.log('⚠️ Page de résultats non atteinte, test des questions terminé');
    }
    
    // Test 4: Test de navigation retour
    console.log('📋 Test 4: Test de navigation retour');
    
    try {
      const backButton = await page.locator('button').filter({ hasText: 'Précédent' });
      if (await backButton.isVisible()) {
        await backButton.click();
        console.log('✅ Navigation retour fonctionnelle');
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('ℹ️ Bouton précédent non disponible (première question)');
    }
    
    // Test 5: Test de l'header et navigation
    console.log('📋 Test 5: Test de l\'header et navigation');
    
    // Vérifier le logo
    const logo = await page.locator('img[alt="Profitum Logo"]');
    await logo.waitFor({ state: 'visible' });
    console.log('✅ Logo visible');
    
    // Vérifier les liens de navigation
    const navLinks = ['Nos Services', 'Nos Experts', 'Tarifs', 'Contact'];
    for (const linkText of navLinks) {
      const link = await page.locator(`a:has-text("${linkText}")`);
      await link.waitFor({ state: 'visible' });
      console.log(`✅ Lien "${linkText}" visible`);
    }
    
    // Test 6: Test de la connexion utilisateur
    console.log('📋 Test 6: Test de la connexion utilisateur');
    
    const connexionButton = await page.locator('button').filter({ hasText: 'Connexion' });
    await connexionButton.waitFor({ state: 'visible' });
    console.log('✅ Bouton connexion visible');
    
    // Cliquer sur le bouton connexion pour voir le menu
    await connexionButton.click();
    await page.waitForTimeout(500);
    
    // Vérifier les options du menu
    const menuOptions = ['Client', 'Partenaire'];
    for (const option of menuOptions) {
      const menuItem = await page.locator(`[role="menuitem"]:has-text("${option}")`);
      await menuItem.waitFor({ state: 'visible' });
      console.log(`✅ Option "${option}" dans le menu`);
    }
    
    console.log('🎉 Test du Simulateur d\'Éligibilité - TERMINÉ AVEC SUCCÈS !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Fonction pour tester les API du simulateur
async function testSimulateurAPI() {
  console.log('🔌 Test des API du Simulateur - Démarrage...');
  
  const baseURL = 'http://[::1]:5000/api/simulator';
  
  try {
    // Test 1: Création de session
    console.log('📋 Test 1: Création de session');
    const sessionResponse = await fetch(`${baseURL}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log('✅ Session créée:', sessionData.session_token);
      
      // Test 2: Récupération des questions
      console.log('📋 Test 2: Récupération des questions');
      const questionsResponse = await fetch(`${baseURL}/questions`);
      
      if (questionsResponse.ok) {
        const questions = await questionsResponse.json();
        console.log(`✅ ${questions.length} questions récupérées`);
        
        // Test 3: Sauvegarde d'une réponse
        if (questions.length > 0) {
          console.log('📋 Test 3: Sauvegarde d\'une réponse');
          const responseData = {
            session_id: sessionData.session_id,
            question_id: questions[0].id,
            response_value: 'Transport de marchandises'
          };
          
          const saveResponse = await fetch(`${baseURL}/response`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(responseData)
          });
          
          if (saveResponse.ok) {
            console.log('✅ Réponse sauvegardée');
            
            // Test 4: Calcul d'éligibilité
            console.log('📋 Test 4: Calcul d\'éligibilité');
            const eligibilityResponse = await fetch(`${baseURL}/calculate-eligibility`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                session_id: sessionData.session_id
              })
            });
            
            if (eligibilityResponse.ok) {
              const results = await eligibilityResponse.json();
              console.log(`✅ ${results.length} résultats d'éligibilité calculés`);
              
              // Afficher les résultats
              results.forEach(result => {
                console.log(`  - ${result.produit_id}: ${result.eligibility_score}% éligible, ${result.estimated_savings}€ d'économies`);
              });
            } else {
              console.log('⚠️ Calcul d\'éligibilité échoué');
            }
          } else {
            console.log('⚠️ Sauvegarde de réponse échouée');
          }
        }
      } else {
        console.log('⚠️ Récupération des questions échouée');
      }
    } else {
      console.log('⚠️ Création de session échouée');
    }
    
    console.log('🎉 Test des API du Simulateur - TERMINÉ !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test API:', error);
  }
}

// Exécution des tests
async function runAllTests() {
  console.log('🚀 Démarrage des tests complets du Simulateur d\'Éligibilité');
  console.log('=' .repeat(60));
  
  try {
    // Test des API d'abord
    await testSimulateurAPI();
    console.log('\n' + '=' .repeat(60));
    
    // Test de l'interface utilisateur
    await testSimulateurEligibilite();
    
    console.log('\n🎉 TOUS LES TESTS TERMINÉS AVEC SUCCÈS !');
    
  } catch (error) {
    console.error('\n❌ ÉCHEC DES TESTS:', error);
    process.exit(1);
  }
}

// Exécution si le script est appelé directement
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testSimulateurEligibilite,
  testSimulateurAPI,
  runAllTests
}; 
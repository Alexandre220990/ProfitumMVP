import { test, expect } from '@playwright/test';
import { SimulateurHelpers } from '../utils/simulateur-helpers';

test.describe('Test UX Simulateur Complet - Inscription', () => {
  let helpers: SimulateurHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new SimulateurHelpers(page);
    
    // Configuration pour éviter les problèmes de CORS et de sécurité
    await page.addInitScript(() => {
      // Mock des analytics pour éviter les erreurs
      (window as any).gtag = () => {};
      (window as any).mixpanel = { track: () => {} };
    });
  });

  test('Simulateur complet avec inscription - Flux UX', async ({ page }) => {
    console.log('[TEST] 🚀 Début du test UX simulateur complet');
    
    // ===== ÉTAPE 1: ACCÈS AU SIMULATEUR =====
    console.log('[TEST] 📍 Étape 1: Accès au simulateur');
    await page.goto('/simulateur-eligibilite');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('01-simulateur-acces');
    
    // Vérification de la page d'accueil du simulateur
    await helpers.waitForElement('h1');
    await helpers.expectText('h1', /Simulateur|Éligibilité/);
    
    // ===== ÉTAPE 2: CLIC SUR "COMMENCER LA SIMULATION" =====
    console.log('[TEST] 📍 Étape 2: Clic sur "Commencer la simulation"');
    await helpers.startSimulation();
    
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('02-simulation-demarree');
    
    // ===== ÉTAPE 3: RÉPONSE AUX QUESTIONS =====
    console.log('[TEST] 📍 Étape 3: Réponse aux questions');
    
    // Configuration des réponses types pour le simulateur
    const questionsResponses = [
      { type: 'secteur', value: 'Transport' },
      { type: 'employes', value: '15' },
      { type: 'vehicules', value: '8' },
      { type: 'carburant', value: 'Diesel' },
      { type: 'chiffre_affaires', value: '750000' },
      { type: 'localisation', value: 'Île-de-France' }
    ];
    
    let questionCount = 0;
    const maxQuestions = 10; // Limite de sécurité
    
    while (questionCount < maxQuestions) {
      try {
        // Attendre qu'une question soit visible
        await helpers.waitForElement('form, .question, [data-testid="question"]', 5000);
        
        // Identifier le type de question et répondre
        const questionType = await page.evaluate(() => {
          const questionText = document.querySelector('h2, h3, .question-text, label')?.textContent?.toLowerCase() || '';
          
          if (questionText.includes('secteur') || questionText.includes('activité')) return 'secteur';
          if (questionText.includes('employé') || questionText.includes('salarié')) return 'employes';
          if (questionText.includes('véhicule') || questionText.includes('camion')) return 'vehicules';
          if (questionText.includes('carburant') || questionText.includes('essence')) return 'carburant';
          if (questionText.includes('chiffre') || questionText.includes('affaires') || questionText.includes('ca')) return 'chiffre_affaires';
          if (questionText.includes('localisation') || questionText.includes('région')) return 'localisation';
          
          return 'default';
        });
        
        console.log(`[TEST] Question ${questionCount + 1} détectée: ${questionType}`);
        
        // Répondre selon le type de question
        const response = questionsResponses.find(r => r.type === questionType) || { type: 'default', value: 'Oui' };
        await helpers.answerQuestion(questionType, response.value);
        
        // Passer à la question suivante
        await helpers.nextQuestion();
        
        questionCount++;
        await helpers.waitForNavigation();
        await helpers.takeScreenshot(`03-question-${questionCount}`);
        
        // Vérifier si on est arrivé aux résultats
        try {
          await helpers.waitForResults();
          console.log('[TEST] ✅ Arrivé aux résultats de simulation');
          break;
        } catch (e) {
          // Continuer avec la question suivante
        }
        
      } catch (e) {
        console.log(`[TEST] ⚠️ Erreur lors de la question ${questionCount + 1}:`, e);
        break;
      }
    }
    
    // ===== ÉTAPE 4: VÉRIFICATION DES RÉSULTATS =====
    console.log('[TEST] 📍 Étape 4: Vérification des résultats');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('04-resultats-simulation');
    
    // Vérifier que les résultats s'affichent
    await helpers.expectText('body', /Résultats|Éligible|Économies|Produits/);
    
    // ===== ÉTAPE 5: CLIC SUR "S'INSCRIRE" =====
    console.log('[TEST] 📍 Étape 5: Clic sur "S\'inscrire"');
    await helpers.clickInscription();
    
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('05-page-inscription');
    
    // ===== ÉTAPE 6: REMPLISSAGE DU FORMULAIRE D'INSCRIPTION =====
    console.log('[TEST] 📍 Étape 6: Remplissage du formulaire d\'inscription');
    
    const formData = await helpers.fillInscriptionForm();
    console.log(`[TEST] 📊 Données générées - SIREN: ${formData.siren}, Téléphone: ${formData.phone}, Email: ${formData.email}`);
    
    await helpers.takeScreenshot('06-formulaire-rempli');
    
    // ===== ÉTAPE 7: SOUMISSION DU FORMULAIRE =====
    console.log('[TEST] 📍 Étape 7: Soumission du formulaire');
    await helpers.submitInscriptionForm();
    
    // ===== ÉTAPE 8: VÉRIFICATION DE LA RÉUSSITE =====
    console.log('[TEST] 📍 Étape 8: Vérification de la réussite');
    
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('07-inscription-terminee');
    
    await helpers.verifyInscriptionSuccess();
    
    // Vérification finale
    await helpers.checkForErrors();
    
    console.log('[TEST] 🎉 Test UX simulateur complet terminé avec succès !');
  });
}); 
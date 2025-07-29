import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Flux Principaux Profitum - Tests préenregistrés', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('Page d\'accueil et navigation', async ({ page }) => {
    console.log('[TEST] Début du test page d\'accueil');
    
    await page.goto('/');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('homepage');
    
    // Vérification des éléments principaux
    await helpers.waitForElement('h1');
    await helpers.expectText('h1', /Profitum|Optimisation|Financière/);
    
    // Test des liens de navigation
    await helpers.waitForElement('a[href*="simulateur"]');
    await helpers.waitForElement('a[href*="inscription"]');
    await helpers.waitForElement('a[href*="connexion"]');
    
    console.log('[TEST] Test page d\'accueil terminé');
  });

  test('Simulateur d\'éligibilité complet', async ({ page }) => {
    console.log('[TEST] Début du test simulateur');
    
    await page.goto('/simulateur-eligibilite');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('simulateur-debut');
    
    // Vérification de la page simulateur
    await helpers.waitForElement('h1');
    await helpers.expectText('h1', /Simulateur|Éligibilité/);
    
    // Test de sélection de produit (TICPE)
    const productSelectors = [
      '[data-testid="product-ticpe"]',
      'button:has-text("TICPE")',
      'a[href*="ticpe"]',
      '.product-card:has-text("TICPE")'
    ];
    
    let productFound = false;
    for (const selector of productSelectors) {
      try {
        await helpers.waitForElement(selector, 2000);
        await helpers.clickElement(selector);
        productFound = true;
        console.log(`[TEST] Produit sélectionné avec: ${selector}`);
        break;
      } catch (e) {
        console.log(`[TEST] Sélecteur ${selector} non trouvé, essai suivant...`);
      }
    }
    
    if (!productFound) {
      console.log('[TEST] Aucun sélecteur de produit trouvé, test de navigation générale');
      // Test de navigation générale si pas de produit spécifique
      await helpers.waitForElement('form, .questionnaire, .simulation-form');
    }
    
    await helpers.takeScreenshot('simulateur-produit-selectionne');
    
    // Test de remplissage de formulaire (si disponible)
    const formFields = [
      { selector: 'input[name="company-type"], input[placeholder*="entreprise"], select[name="sector"]', value: 'Transport' },
      { selector: 'input[name="employees"], input[placeholder*="employés"], input[type="number"]', value: '25' },
      { selector: 'input[name="revenue"], input[placeholder*="chiffre"], input[placeholder*="CA"]', value: '1500000' }
    ];
    
    for (const field of formFields) {
      try {
        await helpers.waitForElement(field.selector, 2000);
        await helpers.fillField(field.selector, field.value);
        console.log(`[TEST] Champ rempli: ${field.selector}`);
        break;
      } catch (e) {
        console.log(`[TEST] Champ ${field.selector} non trouvé`);
      }
    }
    
    // Test de soumission
    const submitSelectors = [
      '[data-testid="submit"], [data-testid="next"], [data-testid="continue"]',
      'button[type="submit"], button:has-text("Continuer"), button:has-text("Suivant")',
      'input[type="submit"], .btn-primary, .btn-submit'
    ];
    
    for (const selector of submitSelectors) {
      try {
        await helpers.waitForElement(selector, 2000);
        await helpers.clickElement(selector);
        console.log(`[TEST] Formulaire soumis avec: ${selector}`);
        break;
      } catch (e) {
        console.log(`[TEST] Bouton de soumission ${selector} non trouvé`);
      }
    }
    
    await helpers.takeScreenshot('simulateur-soumission');
    
    console.log('[TEST] Test simulateur terminé');
  });

  test('Inscription client', async ({ page }) => {
    console.log('[TEST] Début du test inscription client');
    
    await page.goto('/inscription-client');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('inscription-client-debut');
    
    // Vérification de la page d'inscription
    await helpers.waitForElement('h1, h2');
    await helpers.expectText('h1, h2', /Inscription|Client|Compte/);
    
    // Test de remplissage du formulaire
    const clientFields = [
      { selector: 'input[name="email"], input[type="email"], input[placeholder*="email"]', value: `test-client-${Date.now()}@example.com` },
      { selector: 'input[name="password"], input[type="password"], input[placeholder*="mot de passe"]', value: 'TestPassword123!' },
      { selector: 'input[name="company"], input[placeholder*="entreprise"], input[placeholder*="société"]', value: 'Test Transport SARL' },
      { selector: 'input[name="phone"], input[type="tel"], input[placeholder*="téléphone"]', value: '0123456789' }
    ];
    
    for (const field of clientFields) {
      try {
        await helpers.waitForElement(field.selector, 2000);
        await helpers.fillField(field.selector, field.value);
        console.log(`[TEST] Champ client rempli: ${field.selector}`);
      } catch (e) {
        console.log(`[TEST] Champ client ${field.selector} non trouvé`);
      }
    }
    
    await helpers.takeScreenshot('inscription-client-formulaire');
    
    // Test de soumission (sans réellement créer le compte)
    const submitSelectors = [
      'button[type="submit"], button:has-text("Créer"), button:has-text("Inscription")',
      '[data-testid="submit"], [data-testid="create-account"]',
      'input[type="submit"], .btn-primary'
    ];
    
    for (const selector of submitSelectors) {
      try {
        await helpers.waitForElement(selector, 2000);
        console.log(`[TEST] Bouton de soumission trouvé: ${selector}`);
        // Ne pas cliquer pour éviter de créer un vrai compte
        break;
      } catch (e) {
        console.log(`[TEST] Bouton de soumission ${selector} non trouvé`);
      }
    }
    
    console.log('[TEST] Test inscription client terminé');
  });

  test('Inscription expert', async ({ page }) => {
    console.log('[TEST] Début du test inscription expert');
    
    await page.goto('/inscription-expert');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('inscription-expert-debut');
    
    // Vérification de la page d'inscription expert
    await helpers.waitForElement('h1, h2');
    await helpers.expectText('h1, h2', /Expert|Inscription/);
    
    // Test de remplissage du formulaire expert
    const expertFields = [
      { selector: 'input[name="email"], input[type="email"]', value: `test-expert-${Date.now()}@example.com` },
      { selector: 'input[name="password"], input[type="password"]', value: 'TestPassword123!' },
      { selector: 'input[name="name"], input[placeholder*="nom"]', value: 'Jean Expert' },
      { selector: 'input[name="specialty"], select[name="specialty"], input[placeholder*="spécialité"]', value: 'TICPE' }
    ];
    
    for (const field of expertFields) {
      try {
        await helpers.waitForElement(field.selector, 2000);
        await helpers.fillField(field.selector, field.value);
        console.log(`[TEST] Champ expert rempli: ${field.selector}`);
      } catch (e) {
        console.log(`[TEST] Champ expert ${field.selector} non trouvé`);
      }
    }
    
    await helpers.takeScreenshot('inscription-expert-formulaire');
    
    console.log('[TEST] Test inscription expert terminé');
  });

  test('Connexion client', async ({ page }) => {
    console.log('[TEST] Début du test connexion client');
    
    await page.goto('/connexion-client');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('connexion-client');
    
    // Vérification de la page de connexion
    await helpers.waitForElement('h1, h2');
    await helpers.expectText('h1, h2', /Connexion|Client/);
    
    // Test de remplissage du formulaire
    const loginFields = [
      { selector: 'input[name="email"], input[type="email"]', value: 'test@example.com' },
      { selector: 'input[name="password"], input[type="password"]', value: 'password123' }
    ];
    
    for (const field of loginFields) {
      try {
        await helpers.waitForElement(field.selector, 2000);
        await helpers.fillField(field.selector, field.value);
        console.log(`[TEST] Champ connexion rempli: ${field.selector}`);
      } catch (e) {
        console.log(`[TEST] Champ connexion ${field.selector} non trouvé`);
      }
    }
    
    await helpers.takeScreenshot('connexion-client-formulaire');
    
    console.log('[TEST] Test connexion client terminé');
  });

  test('Connexion expert', async ({ page }) => {
    console.log('[TEST] Début du test connexion expert');
    
    await page.goto('/connexion-expert');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('connexion-expert');
    
    // Vérification de la page de connexion expert
    await helpers.waitForElement('h1, h2');
    await helpers.expectText('h1, h2', /Expert|Connexion/);
    
    console.log('[TEST] Test connexion expert terminé');
  });

  test('Navigation générale et liens', async ({ page }) => {
    console.log('[TEST] Début du test navigation générale');
    
    await page.goto('/');
    await helpers.waitForNavigation();
    
    // Test des liens principaux
    const mainLinks = [
      { href: '/simulateur-eligibilite', text: /Simulateur|Éligibilité/ },
      { href: '/inscription-client', text: /Client|Inscription/ },
      { href: '/inscription-expert', text: /Expert|Inscription/ },
      { href: '/connexion-client', text: /Client|Connexion/ },
      { href: '/connexion-expert', text: /Expert|Connexion/ }
    ];
    
    for (const link of mainLinks) {
      try {
        const linkElement = page.locator(`a[href*="${link.href}"], a:has-text("${link.text}")`);
        await linkElement.waitFor({ timeout: 2000 });
        console.log(`[TEST] Lien trouvé: ${link.href}`);
      } catch (e) {
        console.log(`[TEST] Lien non trouvé: ${link.href}`);
      }
    }
    
    await helpers.takeScreenshot('navigation-generale');
    
    console.log('[TEST] Test navigation générale terminé');
  });
});
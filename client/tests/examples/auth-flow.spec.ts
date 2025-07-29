import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Flux d\'authentification', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // Configuration des logs pour ce test
    page.on('console', msg => {
      console.log(`[AUTH TEST] Console: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.error(`[AUTH TEST] Erreur: ${error.message}`);
    });
  });

  test('Connexion utilisateur avec logs détaillés', async ({ page }) => {
    console.log('[TEST] Début du test de connexion');
    
    // Navigation vers la page de connexion
    await page.goto('/login');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('login-page');
    
    // Vérification que la page est chargée
    await helpers.waitForElement('h1');
    await helpers.expectText('h1', 'Connexion');
    
    // Remplissage du formulaire
    await helpers.fillField('[data-testid="email"]', 'test@example.com');
    await helpers.fillField('[data-testid="password"]', 'password123');
    
    // Vérification des erreurs avant soumission
    await helpers.checkForErrors();
    
    // Soumission du formulaire
    await helpers.clickElement('[data-testid="submit-button"]');
    await helpers.waitForNavigation();
    
    // Vérification de la redirection
    await helpers.takeScreenshot('after-login');
    await expect(page).toHaveURL(/dashboard/);
    
    console.log('[TEST] Test de connexion terminé avec succès');
  });

  test('Gestion des erreurs de connexion', async ({ page }) => {
    console.log('[TEST] Début du test de gestion d\'erreurs');
    
    await page.goto('/login');
    
    // Test avec identifiants invalides
    await helpers.fillField('[data-testid="email"]', 'invalid@example.com');
    await helpers.fillField('[data-testid="password"]', 'wrongpassword');
    await helpers.clickElement('[data-testid="submit-button"]');
    
    // Attendre le message d'erreur
    await helpers.waitForElement('[data-testid="error-message"]');
    await helpers.expectText('[data-testid="error-message"]', 'Identifiants invalides');
    
    await helpers.takeScreenshot('login-error');
    console.log('[TEST] Test de gestion d\'erreurs terminé');
  });
});
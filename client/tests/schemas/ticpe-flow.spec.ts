import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Flux TICPE - Tests préenregistrés', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // Mock de l'authentification client
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-client-token');
      localStorage.setItem('user-type', 'client');
    });
  });

  test('Simulation TICPE complète', async ({ page }) => {
    console.log('[TEST] Début du test de simulation TICPE');
    
    // 1. Accès au simulateur
    await page.goto('/simulateur-eligibilite');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('simulateur-debut');
    
    // 2. Sélection du produit TICPE
    await helpers.waitForElement('[data-testid="product-ticpe"]');
    await helpers.clickElement('[data-testid="product-ticpe"]');
    await helpers.takeScreenshot('selection-ticpe');
    
    // 3. Remplissage des informations entreprise
    await helpers.fillField('[data-testid="company-type"]', 'Transport');
    await helpers.fillField('[data-testid="employee-count"]', '25');
    await helpers.fillField('[data-testid="annual-revenue"]', '1500000');
    await helpers.clickElement('[data-testid="next-step"]');
    
    // 4. Informations véhicules
    await helpers.waitForElement('[data-testid="vehicle-section"]');
    await helpers.fillField('[data-testid="trucks-count"]', '5');
    await helpers.fillField('[data-testid="vans-count"]', '3');
    await helpers.fillField('[data-testid="fuel-consumption"]', '50000');
    await helpers.clickElement('[data-testid="next-step"]');
    
    // 5. Vérification des résultats
    await helpers.waitForElement('[data-testid="eligibility-result"]');
    await helpers.expectText('[data-testid="eligibility-percentage"]', /[0-9]+%/);
    await helpers.expectText('[data-testid="estimated-gain"]', /[0-9]+/);
    await helpers.takeScreenshot('resultats-ticpe');
    
    // 6. Création de compte depuis les résultats
    await helpers.clickElement('[data-testid="create-account-cta"]');
    await helpers.waitForElement('[data-testid="signup-form"]');
    await helpers.takeScreenshot('creation-compte');
    
    console.log('[TEST] Test de simulation TICPE terminé');
  });

  test('Dashboard client - Gestion dossier TICPE', async ({ page }) => {
    console.log('[TEST] Début du test dashboard client TICPE');
    
    await page.goto('/dashboard/client');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('dashboard-client');
    
    // Vérification des audits TICPE
    await helpers.waitForElement('[data-testid="audit-ticpe"]');
    await helpers.expectText('[data-testid="audit-ticpe"]', 'TICPE');
    
    // Ouverture du dossier TICPE
    await helpers.clickElement('[data-testid="audit-ticpe"]');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('dossier-ticpe');
    
    // Vérification des étapes
    await helpers.waitForElement('[data-testid="audit-steps"]');
    await helpers.expectText('[data-testid="current-step"]', /Étape [0-9]+/);
    
    // Test d'upload de document
    await helpers.clickElement('[data-testid="upload-document"]');
    await helpers.waitForElement('[data-testid="file-input"]');
    await helpers.takeScreenshot('upload-document');
    
    console.log('[TEST] Test dashboard client TICPE terminé');
  });

  test('Messagerie avec expert TICPE', async ({ page }) => {
    console.log('[TEST] Début du test messagerie expert');
    
    await page.goto('/messagerie-client');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('messagerie-liste');
    
    // Sélection d'une conversation TICPE
    await helpers.waitForElement('[data-testid="conversation-ticpe"]');
    await helpers.clickElement('[data-testid="conversation-ticpe"]');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('conversation-ticpe');
    
    // Envoi d'un message
    await helpers.fillField('[data-testid="message-input"]', 'Bonjour, j\'ai une question sur mon dossier TICPE');
    await helpers.clickElement('[data-testid="send-message"]');
    await helpers.takeScreenshot('message-envoye');
    
    console.log('[TEST] Test messagerie expert terminé');
  });
});
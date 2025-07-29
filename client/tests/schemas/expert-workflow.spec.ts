import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Workflow Expert - Tests préenregistrés', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // Mock de l'authentification expert
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-expert-token');
      localStorage.setItem('user-type', 'expert');
    });
  });

  test('Dashboard expert - Gestion des dossiers', async ({ page }) => {
    console.log('[TEST] Début du test dashboard expert');
    
    await page.goto('/expert/dashboard');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('dashboard-expert');
    
    // Vérification des dossiers assignés
    await helpers.waitForElement('[data-testid="assigned-dossiers"]');
    await helpers.expectText('[data-testid="dossier-count"]', /[0-9]+/);
    
    // Filtrage par type de produit
    await helpers.clickElement('[data-testid="filter-ticpe"]');
    await helpers.waitForElement('[data-testid="filtered-dossiers"]');
    await helpers.takeScreenshot('filtrage-ticpe');
    
    // Ouverture d'un dossier
    await helpers.clickElement('[data-testid="dossier-item"]');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('dossier-expert');
    
    console.log('[TEST] Test dashboard expert terminé');
  });

  test('Gestion des documents clients', async ({ page }) => {
    console.log('[TEST] Début du test gestion documents');
    
    await page.goto('/expert/documents');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('documents-expert');
    
    // Vérification des documents en attente
    await helpers.waitForElement('[data-testid="pending-documents"]');
    await helpers.expectText('[data-testid="pending-count"]', /[0-9]+/);
    
    // Approuver un document
    await helpers.clickElement('[data-testid="approve-document"]');
    await helpers.waitForElement('[data-testid="approval-confirmation"]');
    await helpers.takeScreenshot('approbation-document');
    
    // Rejeter un document avec commentaire
    await helpers.clickElement('[data-testid="reject-document"]');
    await helpers.fillField('[data-testid="rejection-reason"]', 'Document illisible, veuillez fournir une version plus claire');
    await helpers.clickElement('[data-testid="confirm-rejection"]');
    await helpers.takeScreenshot('rejet-document');
    
    console.log('[TEST] Test gestion documents terminé');
  });

  test('Communication avec les clients', async ({ page }) => {
    console.log('[TEST] Début du test communication clients');
    
    await page.goto('/expert/messagerie');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('messagerie-expert');
    
    // Sélection d'une conversation
    await helpers.waitForElement('[data-testid="conversation-list"]');
    await helpers.clickElement('[data-testid="conversation-item"]');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('conversation-expert');
    
    // Envoi d'un message
    await helpers.fillField('[data-testid="message-input"]', 'Bonjour, j\'ai besoin de documents supplémentaires pour finaliser votre dossier');
    await helpers.clickElement('[data-testid="send-message"]');
    await helpers.takeScreenshot('message-envoye-expert');
    
    // Envoi d'un message urgent
    await helpers.clickElement('[data-testid="urgent-message"]');
    await helpers.fillField('[data-testid="urgent-message-input"]', 'URGENT : Délai de 48h pour fournir les documents manquants');
    await helpers.clickElement('[data-testid="send-urgent"]');
    await helpers.takeScreenshot('message-urgent');
    
    console.log('[TEST] Test communication clients terminé');
  });

  test('Validation et finalisation de dossier', async ({ page }) => {
    console.log('[TEST] Début du test validation dossier');
    
    await page.goto('/expert/dossier/validation');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('validation-dossier');
    
    // Vérification des étapes de validation
    await helpers.waitForElement('[data-testid="validation-steps"]');
    await helpers.expectText('[data-testid="current-validation-step"]', /Étape [0-9]+/);
    
    // Marquer une étape comme terminée
    await helpers.clickElement('[data-testid="complete-step"]');
    await helpers.waitForElement('[data-testid="step-completed"]');
    await helpers.takeScreenshot('etape-terminee');
    
    // Finaliser le dossier
    await helpers.clickElement('[data-testid="finalize-dossier"]');
    await helpers.waitForElement('[data-testid="finalization-modal"]');
    await helpers.fillField('[data-testid="final-gain-amount"]', '25000');
    await helpers.clickElement('[data-testid="confirm-finalization"]');
    await helpers.takeScreenshot('dossier-finalise');
    
    console.log('[TEST] Test validation dossier terminé');
  });
});
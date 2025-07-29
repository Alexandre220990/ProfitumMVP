import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Dashboard et navigation', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // Mock de l'authentification pour les tests
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-token');
    });
  });

  test('Navigation dans le dashboard', async ({ page }) => {
    console.log('[TEST] Début du test de navigation dashboard');
    
    await page.goto('/dashboard');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('dashboard-home');
    
    // Vérification des éléments principaux
    await helpers.waitForElement('[data-testid="dashboard-header"]');
    await helpers.waitForElement('[data-testid="navigation-menu"]');
    
    // Test de navigation vers les audits
    await helpers.clickElement('[data-testid="nav-audits"]');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('audits-page');
    
    // Vérification du contenu de la page audits
    await helpers.expectText('h1', 'Audits');
    
    // Retour au dashboard
    await helpers.clickElement('[data-testid="nav-dashboard"]');
    await helpers.waitForNavigation();
    
    console.log('[TEST] Test de navigation terminé');
  });

  test('Interactions avec les widgets', async ({ page }) => {
    console.log('[TEST] Début du test des widgets');
    
    await page.goto('/dashboard');
    
    // Test d'interaction avec un widget de statistiques
    await helpers.waitForElement('[data-testid="stats-widget"]');
    await helpers.clickElement('[data-testid="stats-refresh"]');
    
    // Attendre le chargement des données
    await page.waitForTimeout(2000);
    await helpers.takeScreenshot('widgets-interaction');
    
    // Vérification que les données sont mises à jour
    await helpers.waitForElement('[data-testid="stats-value"]');
    
    console.log('[TEST] Test des widgets terminé');
  });

  test('Gestion des erreurs de chargement', async ({ page }) => {
    console.log('[TEST] Début du test de gestion d\'erreurs');
    
    // Intercepter les requêtes pour simuler une erreur
    await page.route('**/api/dashboard-data', route => {
      route.fulfill({ status: 500, body: '{"error": "Server error"}' });
    });
    
    await page.goto('/dashboard');
    await helpers.waitForElement('[data-testid="error-message"]');
    await helpers.expectText('[data-testid="error-message"]', 'Erreur de chargement');
    
    await helpers.takeScreenshot('dashboard-error');
    console.log('[TEST] Test de gestion d\'erreurs terminé');
  });
});
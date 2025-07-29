import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Dashboard Admin - Tests préenregistrés', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // Mock de l'authentification admin
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-admin-token');
      localStorage.setItem('user-type', 'admin');
    });
  });

  test('Vue d\'ensemble des métriques', async ({ page }) => {
    console.log('[TEST] Début du test métriques admin');
    
    await page.goto('/admin/dashboard');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('dashboard-admin');
    
    // Vérification des KPIs principaux
    await helpers.waitForElement('[data-testid="total-clients"]');
    await helpers.waitForElement('[data-testid="total-experts"]');
    await helpers.waitForElement('[data-testid="total-dossiers"]');
    await helpers.waitForElement('[data-testid="total-gains"]');
    
    // Vérification des valeurs numériques
    await helpers.expectText('[data-testid="total-clients"]', /[0-9]+/);
    await helpers.expectText('[data-testid="total-experts"]', /[0-9]+/);
    await helpers.expectText('[data-testid="total-dossiers"]', /[0-9]+/);
    await helpers.expectText('[data-testid="total-gains"]', /[0-9]+/);
    
    await helpers.takeScreenshot('metriques-admin');
    console.log('[TEST] Test métriques admin terminé');
  });

  test('Gestion des experts', async ({ page }) => {
    console.log('[TEST] Début du test gestion experts');
    
    await page.goto('/admin/experts');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('liste-experts');
    
    // Filtrage des experts
    await helpers.clickElement('[data-testid="filter-active"]');
    await helpers.waitForElement('[data-testid="filtered-experts"]');
    await helpers.takeScreenshot('experts-actifs');
    
    // Ajout d'un nouvel expert
    await helpers.clickElement('[data-testid="add-expert"]');
    await helpers.waitForElement('[data-testid="expert-form"]');
    await helpers.fillField('[data-testid="expert-name"]', 'Jean Expert');
    await helpers.fillField('[data-testid="expert-email"]', 'jean.expert@example.com');
    await helpers.fillField('[data-testid="expert-specialty"]', 'TICPE');
    await helpers.clickElement('[data-testid="save-expert"]');
    await helpers.takeScreenshot('expert-ajoute');
    
    console.log('[TEST] Test gestion experts terminé');
  });

  test('Monitoring des dossiers', async ({ page }) => {
    console.log('[TEST] Début du test monitoring dossiers');
    
    await page.goto('/admin/dossiers');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('monitoring-dossiers');
    
    // Filtrage par statut
    await helpers.clickElement('[data-testid="filter-en-cours"]');
    await helpers.waitForElement('[data-testid="dossiers-en-cours"]');
    await helpers.takeScreenshot('dossiers-en-cours');
    
    // Détails d'un dossier
    await helpers.clickElement('[data-testid="dossier-details"]');
    await helpers.waitForElement('[data-testid="dossier-modal"]');
    await helpers.takeScreenshot('details-dossier');
    
    // Réassignation d'expert
    await helpers.clickElement('[data-testid="reassign-expert"]');
    await helpers.waitForElement('[data-testid="expert-selector"]');
    await helpers.clickElement('[data-testid="select-expert"]');
    await helpers.clickElement('[data-testid="confirm-reassignment"]');
    await helpers.takeScreenshot('reassignation-expert');
    
    console.log('[TEST] Test monitoring dossiers terminé');
  });

  test('Analytics et rapports', async ({ page }) => {
    console.log('[TEST] Début du test analytics');
    
    await page.goto('/admin/analytics');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('analytics-page');
    
    // Sélection de la période
    await helpers.clickElement('[data-testid="period-selector"]');
    await helpers.clickElement('[data-testid="last-month"]');
    await helpers.waitForElement('[data-testid="updated-charts"]');
    await helpers.takeScreenshot('analytics-periode');
    
    // Export des données
    await helpers.clickElement('[data-testid="export-data"]');
    await helpers.waitForElement('[data-testid="export-modal"]');
    await helpers.clickElement('[data-testid="export-csv"]');
    await helpers.takeScreenshot('export-analytics');
    
    console.log('[TEST] Test analytics terminé');
  });

  test('Gestion des notifications', async ({ page }) => {
    console.log('[TEST] Début du test notifications admin');
    
    await page.goto('/admin/notifications');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('notifications-admin');
    
    // Test d'envoi de notification
    await helpers.clickElement('[data-testid="send-notification"]');
    await helpers.waitForElement('[data-testid="notification-form"]');
    await helpers.fillField('[data-testid="notification-title"]', 'Maintenance prévue');
    await helpers.fillField('[data-testid="notification-message"]', 'Une maintenance est prévue ce soir à 22h');
    await helpers.clickElement('[data-testid="notification-type-info"]');
    await helpers.clickElement('[data-testid="send-notification-btn"]');
    await helpers.takeScreenshot('notification-envoyee');
    
    console.log('[TEST] Test notifications admin terminé');
  });
});
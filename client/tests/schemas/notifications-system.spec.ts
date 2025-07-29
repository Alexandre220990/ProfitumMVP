import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Système de Notifications - Tests préenregistrés', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    
    // Mock de l'authentification client
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-client-token');
      localStorage.setItem('user-type', 'client');
    });
  });

  test('Test des notifications client', async ({ page }) => {
    console.log('[TEST] Début du test notifications client');
    
    await page.goto('/dashboard/client');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('dashboard-notifications');
    
    // Vérification de la présence des notifications
    await helpers.waitForElement('[data-testid="notifications-bell"]');
    await helpers.clickElement('[data-testid="notifications-bell"]');
    await helpers.waitForElement('[data-testid="notifications-panel"]');
    await helpers.takeScreenshot('panel-notifications');
    
    // Test de notification de message reçu
    await helpers.clickElement('[data-testid="test-message-notification"]');
    await helpers.waitForElement('[data-testid="notification-message-received"]');
    await helpers.expectText('[data-testid="notification-title"]', 'Nouveau message reçu');
    await helpers.takeScreenshot('notification-message');
    
    // Test de notification de document uploadé
    await helpers.clickElement('[data-testid="test-document-notification"]');
    await helpers.waitForElement('[data-testid="notification-document-uploaded"]');
    await helpers.expectText('[data-testid="notification-title"]', 'Nouveau document reçu');
    await helpers.takeScreenshot('notification-document');
    
    // Test de notification urgente
    await helpers.clickElement('[data-testid="test-urgent-notification"]');
    await helpers.waitForElement('[data-testid="notification-urgent"]');
    await helpers.expectText('[data-testid="notification-priority"]', 'urgent');
    await helpers.takeScreenshot('notification-urgente');
    
    console.log('[TEST] Test notifications client terminé');
  });

  test('Actions sur les notifications', async ({ page }) => {
    console.log('[TEST] Début du test actions notifications');
    
    await page.goto('/dashboard/client');
    await helpers.waitForNavigation();
    
    // Ouvrir le panel de notifications
    await helpers.clickElement('[data-testid="notifications-bell"]');
    await helpers.waitForElement('[data-testid="notifications-panel"]');
    
    // Marquer comme lu
    await helpers.clickElement('[data-testid="mark-as-read"]');
    await helpers.waitForElement('[data-testid="notification-read"]');
    await helpers.takeScreenshot('notification-lue');
    
    // Supprimer une notification
    await helpers.clickElement('[data-testid="delete-notification"]');
    await helpers.waitForElement('[data-testid="delete-confirmation"]');
    await helpers.clickElement('[data-testid="confirm-delete"]');
    await helpers.takeScreenshot('notification-supprimee');
    
    // Marquer toutes comme lues
    await helpers.clickElement('[data-testid="mark-all-read"]');
    await helpers.waitForElement('[data-testid="all-notifications-read"]');
    await helpers.takeScreenshot('toutes-lues');
    
    console.log('[TEST] Test actions notifications terminé');
  });

  test('Redirection depuis les notifications', async ({ page }) => {
    console.log('[TEST] Début du test redirection notifications');
    
    await page.goto('/dashboard/client');
    await helpers.waitForNavigation();
    
    // Créer une notification avec redirection
    await helpers.clickElement('[data-testid="create-redirect-notification"]');
    await helpers.waitForElement('[data-testid="notification-with-action"]');
    
    // Cliquer sur la notification pour redirection
    await helpers.clickElement('[data-testid="notification-action"]');
    await helpers.waitForNavigation();
    await helpers.expectText('h1', 'Messagerie');
    await helpers.takeScreenshot('redirection-messagerie');
    
    // Retour au dashboard
    await page.goBack();
    await helpers.waitForNavigation();
    
    // Test de redirection vers un dossier
    await helpers.clickElement('[data-testid="create-dossier-notification"]');
    await helpers.clickElement('[data-testid="dossier-notification-action"]');
    await helpers.waitForNavigation();
    await helpers.expectText('h1', 'Dossier');
    await helpers.takeScreenshot('redirection-dossier');
    
    console.log('[TEST] Test redirection notifications terminé');
  });

  test('Préférences de notifications', async ({ page }) => {
    console.log('[TEST] Début du test préférences notifications');
    
    await page.goto('/profile/client');
    await helpers.waitForNavigation();
    await helpers.takeScreenshot('profile-client');
    
    // Accès aux préférences de notifications
    await helpers.clickElement('[data-testid="notification-preferences"]');
    await helpers.waitForElement('[data-testid="preferences-form"]');
    await helpers.takeScreenshot('preferences-notifications');
    
    // Modification des préférences
    await helpers.clickElement('[data-testid="toggle-email-notifications"]');
    await helpers.clickElement('[data-testid="toggle-push-notifications"]');
    await helpers.clickElement('[data-testid="toggle-sms-notifications"]');
    
    // Sauvegarde des préférences
    await helpers.clickElement('[data-testid="save-preferences"]');
    await helpers.waitForElement('[data-testid="preferences-saved"]');
    await helpers.takeScreenshot('preferences-sauvegardees');
    
    console.log('[TEST] Test préférences notifications terminé');
  });

  test('Notifications en temps réel', async ({ page }) => {
    console.log('[TEST] Début du test notifications temps réel');
    
    await page.goto('/dashboard/client');
    await helpers.waitForNavigation();
    
    // Simuler une notification en temps réel
    await page.evaluate(() => {
      // Simuler l'arrivée d'une notification WebSocket
      const event = new CustomEvent('new-notification', {
        detail: {
          type: 'message_received',
          title: 'Message urgent',
          message: 'L\'expert a besoin de documents immédiatement',
          priority: 'urgent',
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(event);
    });
    
    // Vérifier l'apparition de la notification
    await helpers.waitForElement('[data-testid="realtime-notification"]');
    await helpers.expectText('[data-testid="realtime-notification"]', 'Message urgent');
    await helpers.takeScreenshot('notification-temps-reel');
    
    console.log('[TEST] Test notifications temps réel terminé');
  });
});
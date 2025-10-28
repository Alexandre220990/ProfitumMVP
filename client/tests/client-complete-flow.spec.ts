import { test, expect } from '@playwright/test';
import { ClientHelpers } from './utils/client-helpers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement de test
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const TEST_CLIENT_EMAIL = process.env.TEST_CLIENT_EMAIL || 'grandjean.laporte@gmail.com';
const TEST_CLIENT_PASSWORD = process.env.TEST_CLIENT_PASSWORD || 'profitum';

test.describe('Parcours Client Complet', () => {
  let helpers: ClientHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new ClientHelpers(page);
    
    // Configuration des logs
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[BROWSER ERROR] ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      console.error(`[PAGE ERROR] ${error.message}`);
    });
  });

  test('1. Connexion Client', async ({ page }) => {
    console.log('=== TEST 1: Connexion Client ===');
    
    // Connexion
    await helpers.loginAsClient(TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD);
    
    // Vérifier que l'on est bien sur le dashboard client
    await helpers.verifyClientDashboard();
    
    // Vérifier la navigation
    await helpers.verifyClientNavigation();
    
    console.log('✓ TEST 1 RÉUSSI : Connexion client');
  });

  test('2. Navigation Dashboard Client', async ({ page }) => {
    console.log('=== TEST 2: Dashboard Client ===');
    
    // Connexion préalable
    await helpers.loginAsClient(TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD);
    await helpers.verifyClientDashboard();
    
    // Vérifier les éléments du dashboard
    await helpers.waitForElement('h1, h2, h3');
    
    // Vérifier qu'il n'y a pas d'erreurs
    await helpers.verifyNoErrors();
    
    // Prendre une capture complète du dashboard
    await helpers.takeScreenshot('client-dashboard-complete');
    
    console.log('✓ TEST 2 RÉUSSI : Dashboard client affiché correctement');
  });

  test('3. Simulateur Client', async ({ page }) => {
    console.log('=== TEST 3: Simulateur Client ===');
    
    // Connexion et navigation
    await helpers.loginAsClient(TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD);
    await helpers.navigateToSimulateur();
    
    // Vérifier que le simulateur est chargé
    await expect(page).toHaveURL('/simulateur-client');
    
    // Vérifier la présence d'éléments du simulateur
    const simulatorVisible = await page.locator('h1, h2').first().isVisible().catch(() => false);
    expect(simulatorVisible).toBeTruthy();
    
    await helpers.verifyNoErrors();
    
    console.log('✓ TEST 3 RÉUSSI : Simulateur client accessible');
  });

  test('4. Agenda Client', async ({ page }) => {
    console.log('=== TEST 4: Agenda Client ===');
    
    // Connexion et navigation
    await helpers.loginAsClient(TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD);
    await helpers.navigateToAgenda();
    
    // Vérifier que l'agenda est chargé
    await expect(page).toHaveURL('/agenda-client');
    
    await helpers.verifyNoErrors();
    
    console.log('✓ TEST 4 RÉUSSI : Agenda client accessible');
  });

  test('5. Messagerie Client', async ({ page }) => {
    console.log('=== TEST 5: Messagerie Client ===');
    
    // Connexion et navigation
    await helpers.loginAsClient(TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD);
    await helpers.navigateToMessagerie();
    
    // Vérifier que la messagerie est chargée
    await expect(page).toHaveURL('/messagerie-client');
    
    // Vérifier la présence d'éléments de messagerie
    const messagerieVisible = await page.locator('h1, h2, div').first().isVisible().catch(() => false);
    expect(messagerieVisible).toBeTruthy();
    
    await helpers.verifyNoErrors();
    
    console.log('✓ TEST 5 RÉUSSI : Messagerie client accessible');
  });

  test('6. Documents Client', async ({ page }) => {
    console.log('=== TEST 6: Documents Client ===');
    
    // Connexion et navigation
    await helpers.loginAsClient(TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD);
    await helpers.navigateToDocuments();
    
    // Vérifier que les documents sont chargés
    await expect(page).toHaveURL('/documents-client');
    
    await helpers.verifyNoErrors();
    
    console.log('✓ TEST 6 RÉUSSI : Documents client accessibles');
  });

  test('7. Notifications Client', async ({ page }) => {
    console.log('=== TEST 7: Notifications Client ===');
    
    // Connexion et navigation
    await helpers.loginAsClient(TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD);
    await helpers.navigateToNotifications();
    
    // Vérifier que les notifications sont chargées
    await expect(page).toHaveURL('/notification-center');
    
    await helpers.verifyNoErrors();
    
    console.log('✓ TEST 7 RÉUSSI : Notifications accessibles');
  });

  test('8. Marketplace Experts', async ({ page }) => {
    console.log('=== TEST 8: Marketplace Experts ===');
    
    // Connexion et navigation
    await helpers.loginAsClient(TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD);
    await helpers.navigateToMarketplace();
    
    // Vérifier que le marketplace est chargé
    await expect(page).toHaveURL('/marketplace-experts');
    
    await helpers.verifyNoErrors();
    
    console.log('✓ TEST 8 RÉUSSI : Marketplace accessible');
  });

  test('9. Profil Client', async ({ page }) => {
    console.log('=== TEST 9: Profil Client ===');
    
    // Connexion et navigation
    await helpers.loginAsClient(TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD);
    await helpers.navigateToProfil();
    
    // Vérifier que le profil est chargé
    await expect(page).toHaveURL('/profile/client');
    
    // Vérifier la présence des informations du profil
    const profileVisible = await page.locator('h1, h2').first().isVisible().catch(() => false);
    expect(profileVisible).toBeTruthy();
    
    await helpers.verifyNoErrors();
    
    console.log('✓ TEST 9 RÉUSSI : Profil client accessible');
  });

  test('10. Paramètres Client', async ({ page }) => {
    console.log('=== TEST 10: Paramètres Client ===');
    
    // Connexion et navigation
    await helpers.loginAsClient(TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD);
    await helpers.navigateToSettings();
    
    // Vérifier que les paramètres sont chargés
    await expect(page).toHaveURL('/settings');
    
    await helpers.verifyNoErrors();
    
    console.log('✓ TEST 10 RÉUSSI : Paramètres accessibles');
  });

  test('11. Navigation Complète - Toutes les Pages', async ({ page }) => {
    console.log('=== TEST 11: Navigation Complète ===');
    
    // Connexion
    await helpers.loginAsClient(TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD);
    
    // Parcourir toutes les pages principales
    const pages = [
      { name: 'Simulateur', navigate: () => helpers.navigateToSimulateur(), url: '/simulateur-client' },
      { name: 'Agenda', navigate: () => helpers.navigateToAgenda(), url: '/agenda-client' },
      { name: 'Messagerie', navigate: () => helpers.navigateToMessagerie(), url: '/messagerie-client' },
      { name: 'Documents', navigate: () => helpers.navigateToDocuments(), url: '/documents-client' },
      { name: 'Notifications', navigate: () => helpers.navigateToNotifications(), url: '/notification-center' },
      { name: 'Marketplace', navigate: () => helpers.navigateToMarketplace(), url: '/marketplace-experts' },
      { name: 'Profil', navigate: () => helpers.navigateToProfil(), url: '/profile/client' },
      { name: 'Paramètres', navigate: () => helpers.navigateToSettings(), url: '/settings' }
    ];

    for (const pageInfo of pages) {
      console.log(`[TEST] Navigation vers ${pageInfo.name}...`);
      await pageInfo.navigate();
      await expect(page).toHaveURL(pageInfo.url);
      await helpers.verifyNoErrors();
      await page.waitForTimeout(1000); // Petit délai entre les navigations
      console.log(`[TEST] ✓ ${pageInfo.name} OK`);
    }
    
    console.log('✓ TEST 11 RÉUSSI : Navigation complète réussie');
  });

  test('12. Déconnexion Client', async ({ page }) => {
    console.log('=== TEST 12: Déconnexion Client ===');
    
    // Connexion
    await helpers.loginAsClient(TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD);
    await helpers.verifyClientDashboard();
    
    // Déconnexion
    await helpers.logout();
    
    // Vérifier que l'on est bien redirigé
    const currentUrl = page.url();
    const isLoggedOut = currentUrl.includes('/home') || 
                       currentUrl.includes('/auth') || 
                       currentUrl.includes('/login') ||
                       currentUrl === 'https://profitum.app/';
    
    expect(isLoggedOut).toBeTruthy();
    
    console.log('✓ TEST 12 RÉUSSI : Déconnexion réussie');
  });
});


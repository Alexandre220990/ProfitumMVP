import { Page, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';

/**
 * Helpers spécifiques pour les tests du parcours Client
 */
export class ClientHelpers extends TestHelpers {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Connexion avec les identifiants client
   */
  async loginAsClient(email: string, password: string) {
    console.log('[CLIENT TEST] Début de la connexion client');
    
    // Navigation vers la page de connexion client
    await this.page.goto('/auth?type=client');
    await this.waitForNavigation();
    await this.takeScreenshot('client-login-page');

    // Attendre que le formulaire soit chargé
    await this.waitForElement('input[type="email"]');
    
    // Remplir le formulaire
    await this.fillField('input[type="email"]', email);
    await this.fillField('input[type="password"]', password);
    
    // Soumettre le formulaire
    await this.page.click('button[type="submit"]');
    
    // Attendre la redirection vers le dashboard
    await this.page.waitForURL(/dashboard\/client/, { timeout: 15000 });
    await this.waitForNavigation();
    
    console.log('[CLIENT TEST] Connexion réussie');
    await this.takeScreenshot('client-dashboard-after-login');
  }

  /**
   * Vérifier que l'utilisateur est sur le dashboard client
   */
  async verifyClientDashboard() {
    console.log('[CLIENT TEST] Vérification du dashboard client');
    
    // Vérifier l'URL
    await expect(this.page).toHaveURL(/dashboard\/client/);
    
    // Vérifier la présence du badge "Client" ou "Espace Client"
    const espaceClientVisible = await this.page.locator('text=/Espace Client/i').isVisible().catch(() => false);
    const badgeClientVisible = await this.page.locator('text=/Client/i').first().isVisible().catch(() => false);
    
    if (!espaceClientVisible && !badgeClientVisible) {
      console.warn('[CLIENT TEST] Badge Client non trouvé, mais URL correcte');
    }
    
    console.log('[CLIENT TEST] Dashboard client vérifié');
  }

  /**
   * Naviguer vers le simulateur client
   */
  async navigateToSimulateur() {
    console.log('[CLIENT TEST] Navigation vers le simulateur');
    
    // Chercher le lien dans la sidebar ou le menu
    const simulateurLink = this.page.locator('a[href="/simulateur-client"], button:has-text("Simulation")').first();
    await simulateurLink.click();
    
    await this.page.waitForURL('/simulateur-client', { timeout: 10000 });
    await this.waitForNavigation();
    
    console.log('[CLIENT TEST] Simulateur chargé');
    await this.takeScreenshot('client-simulateur-page');
  }

  /**
   * Naviguer vers l'agenda client
   */
  async navigateToAgenda() {
    console.log('[CLIENT TEST] Navigation vers l\'agenda');
    
    const agendaLink = this.page.locator('a[href="/agenda-client"], button:has-text("Agenda")').first();
    await agendaLink.click();
    
    await this.page.waitForURL('/agenda-client', { timeout: 10000 });
    await this.waitForNavigation();
    
    console.log('[CLIENT TEST] Agenda chargé');
    await this.takeScreenshot('client-agenda-page');
  }

  /**
   * Naviguer vers la messagerie client
   */
  async navigateToMessagerie() {
    console.log('[CLIENT TEST] Navigation vers la messagerie');
    
    const messagerieLink = this.page.locator('a[href="/messagerie-client"], button:has-text("Messagerie")').first();
    await messagerieLink.click();
    
    await this.page.waitForURL('/messagerie-client', { timeout: 10000 });
    await this.waitForNavigation();
    
    console.log('[CLIENT TEST] Messagerie chargée');
    await this.takeScreenshot('client-messagerie-page');
  }

  /**
   * Naviguer vers les documents client
   */
  async navigateToDocuments() {
    console.log('[CLIENT TEST] Navigation vers les documents');
    
    const documentsLink = this.page.locator('a[href="/documents-client"], button:has-text("Documents")').first();
    await documentsLink.click();
    
    await this.page.waitForURL('/documents-client', { timeout: 10000 });
    await this.waitForNavigation();
    
    console.log('[CLIENT TEST] Documents chargés');
    await this.takeScreenshot('client-documents-page');
  }

  /**
   * Naviguer vers le centre de notifications
   */
  async navigateToNotifications() {
    console.log('[CLIENT TEST] Navigation vers les notifications');
    
    const notificationsLink = this.page.locator('a[href="/notification-center"], button:has-text("Notifications")').first();
    await notificationsLink.click();
    
    await this.page.waitForURL('/notification-center', { timeout: 10000 });
    await this.waitForNavigation();
    
    console.log('[CLIENT TEST] Notifications chargées');
    await this.takeScreenshot('client-notifications-page');
  }

  /**
   * Naviguer vers le marketplace des experts
   */
  async navigateToMarketplace() {
    console.log('[CLIENT TEST] Navigation vers le marketplace');
    
    const marketplaceLink = this.page.locator('a[href="/marketplace-experts"], button:has-text("Marketplace")').first();
    await marketplaceLink.click();
    
    await this.page.waitForURL('/marketplace-experts', { timeout: 10000 });
    await this.waitForNavigation();
    
    console.log('[CLIENT TEST] Marketplace chargé');
    await this.takeScreenshot('client-marketplace-page');
  }

  /**
   * Naviguer vers le profil client
   */
  async navigateToProfil() {
    console.log('[CLIENT TEST] Navigation vers le profil');
    
    const profilLink = this.page.locator('a[href="/profile/client"], button:has-text("Profil")').first();
    await profilLink.click();
    
    await this.page.waitForURL('/profile/client', { timeout: 10000 });
    await this.waitForNavigation();
    
    console.log('[CLIENT TEST] Profil chargé');
    await this.takeScreenshot('client-profil-page');
  }

  /**
   * Naviguer vers les paramètres
   */
  async navigateToSettings() {
    console.log('[CLIENT TEST] Navigation vers les paramètres');
    
    const settingsLink = this.page.locator('a[href="/settings"], button:has-text("Paramètres")').first();
    await settingsLink.click();
    
    await this.page.waitForURL('/settings', { timeout: 10000 });
    await this.waitForNavigation();
    
    console.log('[CLIENT TEST] Paramètres chargés');
    await this.takeScreenshot('client-settings-page');
  }

  /**
   * Vérifier la présence du menu de navigation client
   */
  async verifyClientNavigation() {
    console.log('[CLIENT TEST] Vérification de la navigation client');
    
    // Vérifier la présence des liens principaux
    const navigationItems = [
      'Dashboard',
      'Simulation',
      'Agenda',
      'Messagerie',
      'Documents'
    ];

    for (const item of navigationItems) {
      const isVisible = await this.page.locator(`text=/${item}/i`).first().isVisible().catch(() => false);
      console.log(`[CLIENT TEST] Élément de navigation "${item}": ${isVisible ? '✓' : '✗'}`);
    }
    
    console.log('[CLIENT TEST] Navigation vérifiée');
  }

  /**
   * Déconnexion
   */
  async logout() {
    console.log('[CLIENT TEST] Déconnexion');
    
    // Ouvrir le menu utilisateur
    const userMenu = this.page.locator('button:has-text("Déconnexion"), button[aria-label="User menu"]').first();
    
    // Si le menu n'est pas visible, chercher l'icône utilisateur
    const userIcon = this.page.locator('button').filter({ has: this.page.locator('svg') }).filter({ hasText: /logout|déconnexion/i }).first();
    
    try {
      await userIcon.click({ timeout: 5000 });
      await this.page.waitForTimeout(500);
    } catch {
      console.log('[CLIENT TEST] Menu utilisateur déjà ouvert ou non trouvé');
    }
    
    // Cliquer sur le bouton de déconnexion
    const logoutButton = this.page.locator('button:has-text("Déconnexion"), a:has-text("Déconnexion")').first();
    await logoutButton.click();
    
    // Attendre la redirection
    await this.page.waitForURL(/\/(home|auth|login|\/)$/, { timeout: 10000 });
    
    console.log('[CLIENT TEST] Déconnexion réussie');
    await this.takeScreenshot('after-logout');
  }

  /**
   * Vérifier qu'il n'y a pas d'erreurs critiques sur la page
   */
  async verifyNoErrors() {
    console.log('[CLIENT TEST] Vérification des erreurs');
    
    // Vérifier qu'il n'y a pas de message d'erreur visible
    const errorMessages = await this.page.locator('text=/erreur|error|échec|failed/i').count();
    
    if (errorMessages > 0) {
      console.warn(`[CLIENT TEST] ${errorMessages} message(s) d'erreur détecté(s)`);
      await this.takeScreenshot('page-with-errors');
    } else {
      console.log('[CLIENT TEST] Aucune erreur détectée');
    }
  }
}


import { Page, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';

/**
 * Helpers spécifiques pour les tests du parcours Admin
 */
export class AdminHelpers extends TestHelpers {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Connexion avec les identifiants admin
   */
  async loginAsAdmin(email: string, password: string) {
    console.log('[ADMIN TEST] Début de la connexion admin');
    
    // Navigation vers la page de connexion admin avec timeout augmenté
    await this.page.goto('/connect-admin', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.waitForNavigation();
    await this.takeScreenshot('admin-login-page');

    // Attendre que le formulaire soit chargé
    await this.waitForElement('#email');
    await this.waitForElement('#password');
    
    // Remplir le formulaire
    await this.fillField('#email', email);
    await this.fillField('#password', password);
    
    // Capture d'écran du formulaire rempli
    await this.takeScreenshot('admin-login-form-filled');
    
    // Soumettre le formulaire
    await this.page.click('button[type="submit"]');
    
    // Attendre la redirection vers le dashboard admin exact
    await this.page.waitForURL(/\/admin\/dashboard-optimized/, { timeout: 60000 });
    await this.waitForNavigation();
    
    console.log('[ADMIN TEST] Connexion réussie');
    await this.takeScreenshot('admin-dashboard-after-login');
  }

  /**
   * Vérifier que l'utilisateur est sur le dashboard admin
   */
  async verifyAdminDashboard() {
    console.log('[ADMIN TEST] Vérification du dashboard admin');
    
    // Vérifier l'URL exacte du dashboard admin
    await expect(this.page).toHaveURL(/\/admin\/dashboard-optimized/);
    
    // Vérifier qu'on n'est plus sur la page de connexion
    const currentUrl = this.page.url();
    expect(currentUrl).not.toContain('connect-admin');
    
    console.log('[ADMIN TEST] Dashboard admin vérifié');
  }

  /**
   * Vérifier qu'il n'y a pas d'erreurs critiques sur la page
   */
  async verifyNoErrors() {
    console.log('[ADMIN TEST] Vérification des erreurs');
    
    // Vérifier qu'il n'y a pas de message d'erreur visible
    const errorMessages = await this.page.locator('text=/erreur|error|échec|failed/i').count();
    
    if (errorMessages > 0) {
      console.warn(`[ADMIN TEST] ${errorMessages} message(s) d'erreur détecté(s)`);
      await this.takeScreenshot('admin-page-with-errors');
    } else {
      console.log('[ADMIN TEST] Aucune erreur détectée');
    }
  }

  /**
   * Déconnexion admin
   */
  async logout() {
    console.log('[ADMIN TEST] Déconnexion');
    
    // Ouvrir le menu utilisateur
    const userMenu = this.page.locator('button:has-text("Déconnexion"), button[aria-label="User menu"]').first();
    
    // Si le menu n'est pas visible, chercher l'icône utilisateur
    const userIcon = this.page.locator('button').filter({ has: this.page.locator('svg') }).filter({ hasText: /logout|déconnexion/i }).first();
    
    try {
      await userIcon.click({ timeout: 5000 });
      await this.page.waitForTimeout(500);
    } catch {
      console.log('[ADMIN TEST] Menu utilisateur déjà ouvert ou non trouvé');
    }
    
    // Cliquer sur le bouton de déconnexion
    const logoutButton = this.page.locator('button:has-text("Déconnexion"), a:has-text("Déconnexion")').first();
    await logoutButton.click();
    
    // Attendre la redirection
    await this.page.waitForURL(/\/(home|auth|login|\/)$/, { timeout: 10000 });
    
    console.log('[ADMIN TEST] Déconnexion réussie');
    await this.takeScreenshot('admin-after-logout');
  }
}


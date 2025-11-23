import { test, expect } from '@playwright/test';
import { AdminHelpers } from './utils/admin-helpers';

test.describe('Connexion Admin', () => {
  let adminHelpers: AdminHelpers;

  // Augmenter le timeout global pour ces tests (120 secondes)
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    adminHelpers = new AdminHelpers(page);
    
    // Configuration des logs pour ce test
    page.on('console', msg => {
      console.log(`[ADMIN TEST] Console: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.error(`[ADMIN TEST] Erreur: ${error.message}`);
    });
  });

  test('Test de connexion admin sur /connect-admin', async ({ page }) => {
    console.log('🚀 Début du test de connexion admin');
    
    // 1. Aller sur la page de connexion admin
    console.log('📍 Navigation vers /connect-admin');
    await page.goto('/connect-admin', { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('✅ Page chargée (DOM)');
    
    // Attendre spécifiquement le titre "Connexion Administrateur" pour être sûr que React a rendu
    await page.waitForSelector('text=/Connexion Administrateur/i', { timeout: 30000 });
    console.log('✅ React chargé - titre trouvé');
    
    // Capture d'écran de la page de connexion
    await page.screenshot({ path: 'test-results/admin-01-page-connexion.png', fullPage: true, timeout: 30000 });
    
    // 2. Remplir le formulaire avec les IDs précis
    console.log('📝 Remplissage du formulaire');
    
    // Attendre et remplir l'email avec l'ID exact
    await page.waitForSelector('#email', { state: 'visible', timeout: 10000 });
    await page.fill('#email', 'grandjean.alexandre5@gmail.com');
    console.log('✅ Email rempli');
    
    // Attendre et remplir le mot de passe avec l'ID exact
    await page.waitForSelector('#password', { state: 'visible', timeout: 10000 });
    await page.fill('#password', 'Adminprofitum');
    console.log('✅ Mot de passe rempli');
    
    // Capture d'écran du formulaire rempli
    await page.screenshot({ path: 'test-results/admin-02-formulaire-rempli.png', fullPage: true, timeout: 30000 });
    
    // 3. Soumettre le formulaire
    console.log('🔐 Soumission du formulaire');
    await page.click('button[type="submit"]');
    
    // Attendre la redirection vers le dashboard admin
    console.log('⏳ Attente de la redirection...');
    await page.waitForURL(/\/admin\/dashboard-optimized/, { timeout: 60000 });
    console.log('✅ Redirection effectuée');
    
    // Attendre que la page dashboard soit bien chargée
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Capture d'écran après connexion (avec timeout augmenté)
    await page.screenshot({ path: 'test-results/admin-03-apres-connexion.png', fullPage: true, timeout: 30000 });
    
    // 4. Vérifier qu'on est bien connecté
    const currentUrl = page.url();
    console.log(`📍 URL actuelle: ${currentUrl}`);
    
    // Vérifier qu'on est bien sur le dashboard admin exact
    expect(currentUrl).toContain('/admin/dashboard-optimized');
    
    // Vérifier qu'on n'est plus sur la page de connexion
    expect(currentUrl).not.toContain('connect-admin');
    
    console.log('✅ TEST RÉUSSI : Connexion admin effectuée avec succès !');
  });

  test('Test de connexion admin avec AdminHelpers', async ({ page }) => {
    console.log('🚀 Début du test de connexion admin avec helpers');
    
    // Utiliser le helper pour la connexion
    await adminHelpers.loginAsAdmin('grandjean.alexandre5@gmail.com', 'Adminprofitum');
    
    // Vérifier qu'on est bien sur le dashboard admin
    await adminHelpers.verifyAdminDashboard();
    
    // Vérifier qu'il n'y a pas d'erreurs
    await adminHelpers.verifyNoErrors();
    
    console.log('✅ TEST RÉUSSI : Connexion admin avec helpers effectuée avec succès !');
  });

  test('Test de gestion des erreurs de connexion admin', async ({ page }) => {
    console.log('🚀 Début du test de gestion d\'erreurs admin');
    
    // Navigation vers la page de connexion
    await page.goto('/connect-admin');
    await adminHelpers.waitForNavigation();
    await adminHelpers.takeScreenshot('admin-login-page-error-test');
    
    // Test avec identifiants invalides
    await adminHelpers.fillField('#email', 'invalid@example.com');
    await adminHelpers.fillField('#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Attendre un message d'erreur ou un toast
    await page.waitForTimeout(2000); // Attendre que le toast apparaisse
    
    // Vérifier qu'on est toujours sur la page de connexion (pas de redirection)
    const currentUrl = page.url();
    expect(currentUrl).toContain('connect-admin');
    
    await adminHelpers.takeScreenshot('admin-login-error');
    console.log('✅ TEST RÉUSSI : Gestion des erreurs de connexion vérifiée');
  });
});


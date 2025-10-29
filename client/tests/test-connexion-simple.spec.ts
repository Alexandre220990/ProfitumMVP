import { test, expect } from '@playwright/test';

test('Test de connexion client simple', async ({ page }) => {
  console.log('🚀 Début du test de connexion client');
  
  // 1. Aller sur la page de connexion (utilise baseURL automatiquement)
  console.log('📍 Navigation vers /connexion-client');
  await page.goto('/connexion-client');
  await page.waitForLoadState('networkidle');
  console.log('✅ Page chargée');
  
  // Vérifier qu'on n'est pas sur une page d'erreur 404
  await expect(page.locator('text=404')).not.toBeVisible();
  
  // Capture d'écran de la page de connexion
  await page.screenshot({ path: 'test-results/01-page-connexion.png' });
  
  // 2. Remplir le formulaire (Playwright attend automatiquement que les champs soient visibles)
  console.log('📝 Remplissage du formulaire');
  
  await page.fill('input[type="email"]', 'grandjean.laporte@gmail.com');
  console.log('✅ Email rempli');
  
  await page.fill('input[type="password"]', 'profitum');
  console.log('✅ Mot de passe rempli');
  
  // Capture d'écran du formulaire rempli
  await page.screenshot({ path: 'test-results/02-formulaire-rempli.png' });
  
  // 3. Soumettre le formulaire
  console.log('🔐 Soumission du formulaire');
  await page.click('button[type="submit"]');
  
  // Attendre la redirection vers le dashboard
  await page.waitForURL(/dashboard|client/, { timeout: 30000 });
  console.log('✅ Redirection effectuée');
  
  // Attendre que la page soit complètement chargée
  await page.waitForLoadState('networkidle');
  
  // Capture d'écran après connexion
  await page.screenshot({ path: 'test-results/03-apres-connexion.png' });
  
  // 4. Vérifier qu'on est bien connecté
  const currentUrl = page.url();
  console.log(`📍 URL actuelle: ${currentUrl}`);
  
  // Vérifier qu'on est bien sur une page dashboard/client
  expect(currentUrl).toMatch(/dashboard|client/);
  
  // Vérifier qu'on n'est plus sur la page de connexion
  expect(currentUrl).not.toContain('connexion-client');
  
  console.log('✅ TEST RÉUSSI : Connexion client effectuée avec succès !');
});


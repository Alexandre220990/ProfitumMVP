import { test, expect } from '@playwright/test';

test('Test de connexion client simple', async ({ page }) => {
  console.log('🚀 Début du test de connexion client');
  
  // 1. Aller sur la page de connexion avec timeout long
  console.log('📍 Navigation vers /connexion-client');
  await page.goto('/connexion-client', { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('✅ Page chargée (DOM)');
  
  // Attendre spécifiquement le titre "Connexion" pour être sûr que React a rendu
  await page.waitForSelector('h2:has-text("Connexion")', { timeout: 30000 });
  console.log('✅ React chargé - titre trouvé');
  
  // Capture d'écran de la page de connexion
  await page.screenshot({ path: 'test-results/01-page-connexion.png', fullPage: true });
  
  // 2. Remplir le formulaire avec les IDs précis
  console.log('📝 Remplissage du formulaire');
  
  // Attendre et remplir l'email avec l'ID exact
  await page.waitForSelector('#email', { state: 'visible', timeout: 10000 });
  await page.fill('#email', 'grandjean.laporte@gmail.com');
  console.log('✅ Email rempli');
  
  // Attendre et remplir le mot de passe avec l'ID exact
  await page.waitForSelector('#password', { state: 'visible', timeout: 10000 });
  await page.fill('#password', 'profitum');
  console.log('✅ Mot de passe rempli');
  
  // Capture d'écran du formulaire rempli
  await page.screenshot({ path: 'test-results/02-formulaire-rempli.png', fullPage: true });
  
  // 3. Soumettre le formulaire
  console.log('🔐 Soumission du formulaire');
  await page.click('button[type="submit"]');
  
  // Attendre la redirection vers le dashboard
  console.log('⏳ Attente de la redirection...');
  await page.waitForURL(/dashboard|client/, { timeout: 60000 });
  console.log('✅ Redirection effectuée');
  
  // Attendre que la page dashboard soit bien chargée
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  
  // Capture d'écran après connexion
  await page.screenshot({ path: 'test-results/03-apres-connexion.png', fullPage: true });
  
  // 4. Vérifier qu'on est bien connecté
  const currentUrl = page.url();
  console.log(`📍 URL actuelle: ${currentUrl}`);
  
  // Vérifier qu'on est bien sur une page dashboard/client
  expect(currentUrl).toMatch(/dashboard|client/);
  
  // Vérifier qu'on n'est plus sur la page de connexion
  expect(currentUrl).not.toContain('connexion-client');
  
  console.log('✅ TEST RÉUSSI : Connexion client effectuée avec succès !');
});


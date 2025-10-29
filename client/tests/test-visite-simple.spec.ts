import { test, expect } from '@playwright/test';

test('Test simple de visite de la page d\'accueil', async ({ page }) => {
  console.log('🚀 Début du test - Visite de la page d\'accueil');
  
  // Visiter la page d'accueil
  console.log('📍 Navigation vers https://www.profitum.app');
  await page.goto('https://www.profitum.app', { timeout: 60000 });
  
  console.log('✅ Navigation effectuée');
  
  // Attendre que la page soit chargée
  await page.waitForLoadState('load');
  console.log('✅ Page chargée');
  
  // Capture d'écran
  await page.screenshot({ path: 'test-results/page-accueil.png', fullPage: true });
  console.log('📸 Capture d\'écran prise');
  
  // Vérifier qu'on est bien sur profitum.app
  const url = page.url();
  console.log(`📍 URL actuelle: ${url}`);
  expect(url).toContain('profitum.app');
  
  // Vérifier le titre de la page
  const title = await page.title();
  console.log(`📄 Titre de la page: ${title}`);
  
  console.log('✅ TEST RÉUSSI : Page d\'accueil accessible !');
});


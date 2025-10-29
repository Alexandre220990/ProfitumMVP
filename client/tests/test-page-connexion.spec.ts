import { test, expect } from '@playwright/test';

test('Test simple de visite de la page de connexion', async ({ page }) => {
  console.log('🚀 Début du test - Visite de la page de connexion');
  
  // Visiter la page de connexion
  console.log('📍 Navigation vers https://www.profitum.app/connexion-client');
  await page.goto('https://www.profitum.app/connexion-client', { timeout: 60000 });
  
  console.log('✅ Navigation effectuée');
  
  // Attendre que la page soit chargée
  await page.waitForLoadState('load');
  console.log('✅ Page chargée');
  
  // Capture d'écran
  await page.screenshot({ path: 'test-results/page-connexion-client.png', fullPage: true });
  console.log('📸 Capture d\'écran prise');
  
  // Vérifier qu'on est bien sur la page de connexion
  const url = page.url();
  console.log(`📍 URL actuelle: ${url}`);
  expect(url).toContain('connexion-client');
  
  // Vérifier le titre de la page
  const title = await page.title();
  console.log(`📄 Titre de la page: ${title}`);
  
  // Lister tous les h1, h2, h3 visibles sur la page
  const headers = await page.$$eval('h1, h2, h3', elements => 
    elements.map(el => ({ tag: el.tagName, text: el.textContent?.trim() }))
  );
  console.log('📋 Titres trouvés sur la page:', headers);
  
  // Lister tous les inputs
  const inputs = await page.$$eval('input', elements => 
    elements.map(el => ({ type: el.getAttribute('type'), id: el.id, name: el.name }))
  );
  console.log('📝 Inputs trouvés:', inputs);
  
  console.log('✅ TEST RÉUSSI : Page de connexion accessible !');
});


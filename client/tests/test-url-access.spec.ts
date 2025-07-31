import { test, expect } from '@playwright/test';

test.describe('Test Accessibilité URLs', () => {
  test('Vérifier l\'accès au simulateur', async ({ page }) => {
    console.log('[TEST] 🔍 Test d\'accessibilité du simulateur');
    
    // Test 1: Page d'accueil
    console.log('[TEST] 📍 Test 1: Page d\'accueil');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    console.log(`[TEST] 📄 Titre de la page: ${title}`);
    
    // Test 2: Simulateur
    console.log('[TEST] 📍 Test 2: Simulateur');
    await page.goto('/simulateur-eligibilite');
    await page.waitForLoadState('networkidle');
    
    const simulateurTitle = await page.title();
    console.log(`[TEST] 📄 Titre du simulateur: ${simulateurTitle}`);
    
    // Vérifier le contenu de la page
    const bodyText = await page.textContent('body');
    console.log(`[TEST] 📝 Contenu de la page (premiers 200 caractères): ${bodyText?.substring(0, 200)}`);
    
    // Chercher des éléments spécifiques
    const h1Elements = await page.locator('h1').count();
    const h2Elements = await page.locator('h2').count();
    const h3Elements = await page.locator('h3').count();
    
    console.log(`[TEST] 📊 Éléments trouvés - H1: ${h1Elements}, H2: ${h2Elements}, H3: ${h3Elements}`);
    
    // Prendre une capture d'écran
    await page.screenshot({ path: 'test-results/screenshots/test-url-access.png' });
    
    // Vérifier si la page contient des mots-clés du simulateur
    const hasSimulateurKeywords = bodyText?.toLowerCase().includes('simulateur') || 
                                 bodyText?.toLowerCase().includes('éligibilité') ||
                                 bodyText?.toLowerCase().includes('simulation');
    
    console.log(`[TEST] 🔍 Contient des mots-clés simulateur: ${hasSimulateurKeywords}`);
    
    // Test 3: Autres URLs possibles
    const possibleUrls = [
      '/simulateur',
      '/simulation',
      '/eligibilite',
      '/audit'
    ];
    
    for (const url of possibleUrls) {
      try {
        console.log(`[TEST] 📍 Test URL: ${url}`);
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        const urlTitle = await page.title();
        const urlBodyText = await page.textContent('body');
        
        console.log(`[TEST] ✅ ${url} - Titre: ${urlTitle}`);
        console.log(`[TEST] 📝 ${url} - Contenu: ${urlBodyText?.substring(0, 100)}`);
        
        if (urlBodyText?.toLowerCase().includes('simulateur') || 
            urlBodyText?.toLowerCase().includes('éligibilité')) {
          console.log(`[TEST] 🎯 URL potentielle trouvée: ${url}`);
        }
        
      } catch (e) {
        console.log(`[TEST] ❌ ${url} - Erreur: ${e}`);
      }
    }
  });
}); 
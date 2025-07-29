import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Configuration des logs détaillés
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.error(`[BROWSER ERROR] ${error.message}`);
  });
  
  page.on('requestfailed', request => {
    console.error(`[REQUEST FAILED] ${request.url()}: ${request.failure()?.errorText}`);
  });
  
  await browser.close();
}

export default globalSetup;
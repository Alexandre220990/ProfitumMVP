import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  // Attendre et vérifier qu'un élément est visible
  async waitForElement(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
    console.log(`[TEST] Élément trouvé: ${selector}`);
  }

  // Cliquer sur un élément avec logs
  async clickElement(selector: string) {
    console.log(`[TEST] Clic sur: ${selector}`);
    await this.page.click(selector);
  }

  // Remplir un champ avec logs
  async fillField(selector: string, value: string) {
    console.log(`[TEST] Remplissage du champ ${selector} avec: ${value}`);
    await this.page.fill(selector, value);
  }

  // Vérifier le contenu d'un élément (accepte string ou RegExp)
  async expectText(selector: string, expectedText: string | RegExp) {
    console.log(`[TEST] Vérification du texte dans ${selector}: ${expectedText}`);
    await expect(this.page.locator(selector)).toContainText(expectedText);
  }

  // Prendre une capture d'écran avec nom personnalisé
  async takeScreenshot(name: string) {
    console.log(`[TEST] Capture d'écran: ${name}`);
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  // Attendre la navigation
  async waitForNavigation() {
    console.log('[TEST] Attente de la navigation...');
    await this.page.waitForLoadState('networkidle');
  }

  // Vérifier les erreurs dans la console
  async checkForErrors() {
    const errors = await this.page.evaluate(() => {
      // Capturer les erreurs de console en interceptant console.error
      const consoleErrors: string[] = [];
      const originalError = console.error;
      console.error = (...args) => {
        consoleErrors.push(args.join(' '));
        originalError.apply(console, args);
      };
      return consoleErrors;
    });
    
    if (errors.length > 0) {
      console.error('[TEST] Erreurs détectées dans la console:', errors);
    }
  }

  // Attendre qu'un élément soit cliquable
  async waitForClickable(selector: string) {
    await this.page.waitForSelector(selector, { state: 'visible' });
    await this.page.waitForFunction(
      (sel) => {
        const element = document.querySelector(sel);
        return element && !element.hasAttribute('disabled') && 
               window.getComputedStyle(element).pointerEvents !== 'none';
      },
      selector
    );
    console.log(`[TEST] Élément cliquable: ${selector}`);
  }
}
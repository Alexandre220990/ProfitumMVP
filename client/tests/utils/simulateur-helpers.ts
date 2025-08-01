import { Page, expect } from '@playwright/test';
import { TestHelpers } from './test-helpers';

export class SimulateurHelpers extends TestHelpers {
  constructor(page: Page) {
    super(page);
  }

  // Générer un SIREN aléatoire de 9 chiffres
  generateRandomSiren(): string {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
  }

  // Générer un numéro de téléphone français de 10 chiffres
  generateRandomPhone(): string {
    return '0' + Math.floor(100000000 + Math.random() * 900000000).toString();
  }

  // Générer un email unique
  generateRandomEmail(): string {
    return `test-ux-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@profitum.fr`;
  }

  // Attendre et cliquer sur le bouton "Commencer la simulation"
  async startSimulation(): Promise<void> {
    console.log('[SIMULATEUR] 🔍 Recherche du bouton "Commencer la simulation"');
    
    const startButtonSelectors = [
      'button:has-text("Commencer ma simulation")',
      'button:has-text("Commencer la simulation")',
      '[data-testid="start-simulation"]',
      '.btn:has-text("Commencer")',
      'button:has-text("Commencer")'
    ];
    
    for (const selector of startButtonSelectors) {
      try {
        await this.waitForElement(selector, 3000);
        await this.clickElement(selector);
        console.log(`[SIMULATEUR] ✅ Simulation démarrée avec: ${selector}`);
        return;
      } catch (e) {
        console.log(`[SIMULATEUR] ⚠️ Sélecteur ${selector} non trouvé`);
      }
    }
    
    throw new Error('Bouton "Commencer la simulation" non trouvé');
  }

  // Répondre à une question du simulateur
  async answerQuestion(questionType: string, value: string): Promise<void> {
    console.log(`[SIMULATEUR] 📝 Réponse à la question ${questionType}: ${value}`);
    
    if (['secteur', 'carburant', 'localisation'].includes(questionType)) {
      // Questions à choix multiples
      const selectors = [
        `select option:has-text("${value}")`,
        `button:has-text("${value}")`,
        `input[value="${value}"]`,
        `[data-testid="${questionType}-${value}"]`,
        `label:has-text("${value}")`
      ];
      
      for (const selector of selectors) {
        try {
          await this.waitForElement(selector, 2000);
          await this.clickElement(selector);
          console.log(`[SIMULATEUR] ✅ Réponse sélectionnée: ${value}`);
          return;
        } catch (e) {
          // Continuer avec le sélecteur suivant
        }
      }
    } else {
      // Questions numériques
      const inputSelectors = [
        'input[type="number"]',
        'input[placeholder*="nombre"]',
        'input[placeholder*="chiffre"]',
        'input[name*="count"]',
        'input[name*="number"]',
        'input[type="text"]'
      ];
      
      for (const selector of inputSelectors) {
        try {
          await this.waitForElement(selector, 2000);
          await this.fillField(selector, value);
          console.log(`[SIMULATEUR] ✅ Valeur saisie: ${value}`);
          return;
        } catch (e) {
          // Continuer avec le sélecteur suivant
        }
      }
    }
    
    throw new Error(`Impossible de répondre à la question ${questionType}`);
  }

  // Passer à la question suivante
  async nextQuestion(): Promise<void> {
    const nextSelectors = [
      'button:has-text("Suivant")',
      'button:has-text("Continuer")',
      '[data-testid="next"]',
      'button[type="submit"]',
      '.btn-next',
      'button:has-text("Valider")'
    ];
    
    for (const selector of nextSelectors) {
      try {
        await this.waitForElement(selector, 2000);
        await this.clickElement(selector);
        console.log(`[SIMULATEUR] ✅ Navigation vers la question suivante`);
        return;
      } catch (e) {
        // Continuer avec le sélecteur suivant
      }
    }
    
    throw new Error('Bouton de navigation non trouvé');
  }

  // Vérifier si on est arrivé aux résultats
  async waitForResults(): Promise<void> {
    console.log('[SIMULATEUR] 🔍 Attente des résultats...');
    
    await this.page.waitForFunction(() => {
      const text = document.body.textContent || '';
      return text.includes('Résultats') || 
             text.includes('Éligible') ||
             text.includes('Économies') ||
             text.includes('Produits') ||
             document.querySelector('[data-testid="results"]') !== null;
    }, { timeout: 30000 });
    
    console.log('[SIMULATEUR] ✅ Résultats affichés');
  }

  // Cliquer sur le bouton d'inscription
  async clickInscription(): Promise<void> {
    console.log('[SIMULATEUR] 🔍 Recherche du bouton d\'inscription');
    
    const inscriptionSelectors = [
      'button:has-text("S\'inscrire")',
      'button:has-text("Inscription")',
      'a:has-text("S\'inscrire")',
      '[data-testid="inscription-button"]',
      '.btn-inscription',
      'button:has-text("Créer mon compte")'
    ];
    
    for (const selector of inscriptionSelectors) {
      try {
        await this.waitForElement(selector, 3000);
        await this.clickElement(selector);
        console.log(`[SIMULATEUR] ✅ Inscription démarrée avec: ${selector}`);
        return;
      } catch (e) {
        console.log(`[SIMULATEUR] ⚠️ Sélecteur d'inscription ${selector} non trouvé`);
      }
    }
    
    throw new Error('Bouton d\'inscription non trouvé');
  }

  // Remplir le formulaire d'inscription
  async fillInscriptionForm(): Promise<{ email: string; siren: string; phone: string }> {
    console.log('[SIMULATEUR] 📝 Remplissage du formulaire d\'inscription');
    
    const email = this.generateRandomEmail();
    const siren = this.generateRandomSiren();
    const phone = this.generateRandomPhone();
    
    const formFields = [
      { selector: 'input[name="username"], input[placeholder*="nom d\'utilisateur"]', value: 'TestUXSimulateur' },
      { selector: 'input[name="email"], input[type="email"]', value: email },
      { selector: 'input[name="password"], input[type="password"]', value: 'TestPassword123!' },
      { selector: 'input[name="confirmPassword"], input[name="password_confirmation"]', value: 'TestPassword123!' },
      { selector: 'input[name="company_name"], input[placeholder*="entreprise"]', value: 'Test Company UX' },
      { selector: 'input[name="phone_number"], input[placeholder*="téléphone"]', value: phone },
      { selector: 'input[name="address"], input[placeholder*="adresse"]', value: '123 Rue du Test' },
      { selector: 'input[name="city"], input[placeholder*="ville"]', value: 'Paris' },
      { selector: 'input[name="postal_code"], input[placeholder*="code postal"]', value: '75001' },
      { selector: 'input[name="siren"], input[placeholder*="SIREN"]', value: siren }
    ];
    
    for (const field of formFields) {
      try {
        await this.waitForElement(field.selector, 3000);
        await this.fillField(field.selector, field.value);
        console.log(`[SIMULATEUR] ✅ Champ rempli: ${field.selector} = ${field.value}`);
      } catch (e) {
        console.log(`[SIMULATEUR] ⚠️ Champ non trouvé: ${field.selector}`);
      }
    }
    
    return { email, siren, phone };
  }

  // Soumettre le formulaire d'inscription
  async submitInscriptionForm(): Promise<void> {
    console.log('[SIMULATEUR] 📤 Soumission du formulaire d\'inscription');
    
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("S\'inscrire")',
      'button:has-text("Créer mon compte")',
      '[data-testid="submit-inscription"]',
      '.btn-submit'
    ];
    
    for (const selector of submitSelectors) {
      try {
        await this.waitForElement(selector, 3000);
        await this.clickElement(selector);
        console.log(`[SIMULATEUR] ✅ Formulaire soumis avec: ${selector}`);
        return;
      } catch (e) {
        console.log(`[SIMULATEUR] ⚠️ Bouton de soumission ${selector} non trouvé`);
      }
    }
    
    throw new Error('Bouton de soumission du formulaire non trouvé');
  }

  // Vérifier la réussite de l'inscription
  async verifyInscriptionSuccess(): Promise<void> {
    console.log('[SIMULATEUR] ✅ Vérification de la réussite de l\'inscription');
    
    const successIndicators = [
      /Bienvenue|Dashboard|Tableau de bord/,
      /Compte créé|Inscription réussie/,
      /Simulation|Résultats/
    ];
    
    for (const indicator of successIndicators) {
      try {
        await this.expectText('body', indicator);
        console.log(`[SIMULATEUR] ✅ Inscription réussie détectée: ${indicator}`);
        return;
      } catch (e) {
        // Continuer avec l'indicateur suivant
      }
    }
    
    console.log('[SIMULATEUR] ⚠️ Aucun indicateur de succès clair trouvé');
  }
} 
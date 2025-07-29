# Guide des Tests UI avec Playwright

## 🚀 Démarrage rapide

### Installation des navigateurs
```bash
npm run test:install
```

### Exécution des tests
```bash
# Tous les tests
npm run test

# Interface graphique (recommandé pour le développement)
npm run test:ui

# Tests avec navigateur visible
npm run test:headed

# Mode debug (pas à pas)
npm run test:debug

# Voir le rapport HTML
npm run test:report
```

## 📁 Structure des tests

```
tests/
├── examples/           # Exemples de tests
│   ├── auth-flow.spec.ts
│   └── dashboard-flow.spec.ts
├── utils/
│   └── test-helpers.ts # Utilitaires de test
├── global-setup.ts     # Configuration globale
└── README.md
```

## 🔧 Fonctionnalités principales

### Logs automatiques détaillés
- ✅ Logs de console du navigateur
- ✅ Erreurs JavaScript
- ✅ Requêtes réseau échouées
- ✅ Actions de test (clics, remplissage, etc.)
- ✅ Captures d'écran automatiques

### Utilitaires de test
- `waitForElement()` - Attendre un élément
- `clickElement()` - Cliquer avec logs
- `fillField()` - Remplir un champ
- `expectText()` - Vérifier du texte
- `takeScreenshot()` - Capture d'écran
- `checkForErrors()` - Vérifier les erreurs

## 📝 Écrire un nouveau test

```typescript
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Mon nouveau test', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('Mon scénario de test', async ({ page }) => {
    console.log('[TEST] Début du test');
    
    await page.goto('/ma-page');
    await helpers.waitForElement('[data-testid="mon-element"]');
    await helpers.clickElement('[data-testid="mon-bouton"]');
    
    await helpers.expectText('[data-testid="resultat"]', 'Texte attendu');
    await helpers.takeScreenshot('fin-test');
    
    console.log('[TEST] Test terminé');
  });
});
```

## 🎯 Bonnes pratiques

### Sélecteurs recommandés
```typescript
// ✅ Utiliser data-testid
await page.click('[data-testid="submit-button"]');

// ✅ Éviter les sélecteurs fragiles
// ❌ await page.click('.btn.btn-primary');
// ✅ await page.click('[data-testid="primary-button"]');
```

### Gestion des attentes
```typescript
// ✅ Attendre les éléments
await helpers.waitForElement('[data-testid="loading"]');
await helpers.waitForNavigation();

// ✅ Éviter les timeouts fixes
// ❌ await page.waitForTimeout(2000);
// ✅ await page.waitForSelector('[data-testid="loaded"]');
```

### Logs et debugging
```typescript
// Logs automatiques avec TestHelpers
await helpers.clickElement('[data-testid="button"]');
// → [TEST] Clic sur: [data-testid="button"]

// Vérification des erreurs
await helpers.checkForErrors();
```

## 📊 Rapports et résultats

### Rapport HTML
Après l'exécution des tests, ouvrez le rapport :
```bash
npm run test:report
```

### Captures d'écran
- Automatiques en cas d'échec
- Manuelles avec `takeScreenshot()`
- Stockées dans `test-results/screenshots/`

### Vidéos
- Automatiques en cas d'échec
- Stockées dans `test-results/videos/`

## 🔍 Debugging

### Mode debug interactif
```bash
npm run test:debug
```

### Interface graphique
```bash
npm run test:ui
```

### Logs détaillés
Les logs incluent :
- Actions de test
- Erreurs de console
- Requêtes réseau
- Éléments trouvés/attendus

## 🚨 Résolution de problèmes

### Test qui échoue
1. Vérifier les logs dans la console
2. Regarder les captures d'écran
3. Utiliser le mode debug
4. Vérifier les sélecteurs

### Éléments non trouvés
1. Vérifier que l'élément existe
2. Attendre le chargement de la page
3. Utiliser des sélecteurs plus robustes
4. Ajouter des `data-testid` si nécessaire
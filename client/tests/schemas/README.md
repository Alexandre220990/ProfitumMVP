# Schémas de Tests Préenregistrés - FinancialTracker

## 🎯 **Schémas disponibles**

### 1. **Flux TICPE** (`ticpe-flow.spec.ts`)
**Scénarios testés :**
- ✅ Simulation TICPE complète (sélection produit → résultats)
- ✅ Dashboard client - Gestion dossier TICPE
- ✅ Messagerie avec expert TICPE

**Utilisation :**
```bash
npm run test -- --grep "Flux TICPE"
```

### 2. **Workflow Expert** (`expert-workflow.spec.ts`)
**Scénarios testés :**
- ✅ Dashboard expert - Gestion des dossiers
- ✅ Gestion des documents clients (approbation/rejet)
- ✅ Communication avec les clients
- ✅ Validation et finalisation de dossier

**Utilisation :**
```bash
npm run test -- --grep "Workflow Expert"
```

### 3. **Dashboard Admin** (`admin-dashboard.spec.ts`)
**Scénarios testés :**
- ✅ Vue d'ensemble des métriques
- ✅ Gestion des experts (ajout, filtrage)
- ✅ Monitoring des dossiers
- ✅ Analytics et rapports
- ✅ Gestion des notifications

**Utilisation :**
```bash
npm run test -- --grep "Dashboard Admin"
```

### 4. **Système de Notifications** (`notifications-system.spec.ts`)
**Scénarios testés :**
- ✅ Test des notifications client
- ✅ Actions sur les notifications (marquer lu, supprimer)
- ✅ Redirection depuis les notifications
- ✅ Préférences de notifications
- ✅ Notifications en temps réel

**Utilisation :**
```bash
npm run test -- --grep "Système de Notifications"
```

## 🚀 **Exécution rapide**

### **Tous les schémas**
```bash
npm run test tests/schemas/
```

### **Schéma spécifique**
```bash
# Flux TICPE uniquement
npm run test tests/schemas/ticpe-flow.spec.ts

# Workflow Expert uniquement
npm run test tests/schemas/expert-workflow.spec.ts

# Dashboard Admin uniquement
npm run test tests/schemas/admin-dashboard.spec.ts

# Notifications uniquement
npm run test tests/schemas/notifications-system.spec.ts
```

### **Mode debug avec interface**
```bash
npm run test:ui tests/schemas/
```

## 📊 **Logs automatiques**

Chaque schéma génère automatiquement :
- ✅ **Logs détaillés** de chaque action
- ✅ **Captures d'écran** à chaque étape
- ✅ **Vérifications** de contenu et navigation
- ✅ **Gestion d'erreurs** avec diagnostics

### **Exemple de logs :**
```
[TEST] Début du test de simulation TICPE
[TEST] Élément trouvé: [data-testid="product-ticpe"]
[TEST] Clic sur: [data-testid="product-ticpe"]
[TEST] Remplissage du champ [data-testid="company-type"] avec: Transport
[TEST] Vérification du texte dans [data-testid="eligibility-percentage"]: 85%
[TEST] Capture d'écran: resultats-ticpe
[TEST] Test de simulation TICPE terminé
```

## 🔧 **Personnalisation des schémas**

### **Modifier les données de test**
```typescript
// Dans ticpe-flow.spec.ts
await helpers.fillField('[data-testid="employee-count"]', '50'); // Au lieu de 25
await helpers.fillField('[data-testid="annual-revenue"]', '3000000'); // Au lieu de 1500000
```

### **Ajouter de nouveaux tests**
```typescript
test('Nouveau scénario personnalisé', async ({ page }) => {
  console.log('[TEST] Début du nouveau test');
  
  // Votre logique de test ici
  await page.goto('/votre-page');
  await helpers.waitForElement('[data-testid="votre-element"]');
  
  console.log('[TEST] Nouveau test terminé');
});
```

## 🎯 **Points d'attention**

### **Sélecteurs data-testid**
Les schémas utilisent des sélecteurs `data-testid` pour la robustesse :
```typescript
// ✅ Robuste
await helpers.clickElement('[data-testid="submit-button"]');

// ❌ Fragile
await helpers.clickElement('.btn.btn-primary');
```

### **Gestion des attentes**
Les schémas incluent des attentes intelligentes :
```typescript
// ✅ Attendre l'élément
await helpers.waitForElement('[data-testid="loading"]');

// ✅ Attendre la navigation
await helpers.waitForNavigation();

// ❌ Éviter les timeouts fixes
// await page.waitForTimeout(2000);
```

## 📈 **Rapports et résultats**

### **Rapport HTML**
```bash
npm run test:report
```

### **Captures d'écran**
Stockées dans `test-results/screenshots/` :
- `simulateur-debut.png`
- `selection-ticpe.png`
- `resultats-ticpe.png`
- `dashboard-client.png`
- etc.

### **Vidéos (en cas d'échec)**
Stockées dans `test-results/videos/`

## 🔄 **Maintenance des schémas**

### **Mise à jour des sélecteurs**
Si vous modifiez l'interface, mettez à jour les `data-testid` :
```typescript
// Ancien
await helpers.clickElement('[data-testid="old-button"]');

// Nouveau
await helpers.clickElement('[data-testid="new-button"]');
```

### **Ajout de nouveaux scénarios**
1. Identifier le nouveau flux à tester
2. Créer un nouveau fichier `nouveau-flux.spec.ts`
3. Utiliser la structure des schémas existants
4. Ajouter les logs appropriés
5. Tester et valider

## 🚨 **Résolution de problèmes**

### **Élément non trouvé**
1. Vérifier que le `data-testid` existe dans le code
2. Attendre le chargement de la page
3. Vérifier les logs pour plus de détails

### **Test qui échoue**
1. Regarder les captures d'écran
2. Vérifier les logs de console
3. Utiliser le mode debug : `npm run test:debug`

### **Performance lente**
1. Vérifier la connexion réseau
2. Optimiser les attentes
3. Utiliser des sélecteurs plus spécifiques
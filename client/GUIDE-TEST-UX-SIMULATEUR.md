# 🧪 Guide Test UX Simulateur avec Playwright

## 📋 **Vue d'ensemble**

Ce guide explique comment utiliser le test d'UX automatisé pour le simulateur d'éligibilité. Le test simule le parcours complet d'un utilisateur :

1. **Accès au simulateur**
2. **Clic sur "Commencer la simulation"**
3. **Réponse aux questions**
4. **Affichage des résultats**
5. **Inscription avec données aléatoires**
6. **Vérification de la réussite**

## 🚀 **Installation et Configuration**

### **Prérequis**
- Node.js (version 16+)
- npm ou yarn
- Playwright installé

### **Installation de Playwright**
```bash
cd client
npm install -D @playwright/test
npx playwright install
```

## 🎯 **Lancement des Tests**

### **Option 1 : Test Complet avec Interface (Recommandé)**
```bash
cd client
./scripts/test-ux-simulateur.sh
```

**Avantages :**
- Interface graphique visible
- Screenshots automatiques
- Rapport HTML détaillé
- Détection visuelle des problèmes

### **Option 2 : Test Rapide (Headless)**
```bash
cd client
./scripts/test-ux-rapide.sh
```

**Avantages :**
- Exécution rapide
- Idéal pour les tests automatisés
- Moins de ressources

### **Option 3 : Lancement Manuel**
```bash
cd client
npx playwright test tests/schemas/simulateur-ux-complet.spec.ts --headed
```

## 📊 **Fichiers de Test**

### **Test Principal**
- `tests/schemas/simulateur-ux-complet.spec.ts` - Test complet du flux UX

### **Helpers Spécialisés**
- `tests/utils/simulateur-helpers.ts` - Fonctions dédiées au simulateur
- `tests/utils/test-helpers.ts` - Helpers génériques

### **Scripts de Lancement**
- `scripts/test-ux-simulateur.sh` - Script complet avec interface
- `scripts/test-ux-rapide.sh` - Script rapide headless

## 🔧 **Configuration du Test**

### **Données Générées Automatiquement**
Le test génère automatiquement :
- **SIREN** : 9 chiffres aléatoires
- **Téléphone** : 10 chiffres français (commence par 0)
- **Email** : Unique avec timestamp

### **Réponses Types du Simulateur**
```typescript
const questionsResponses = [
  { type: 'secteur', value: 'Transport' },
  { type: 'employes', value: '15' },
  { type: 'vehicules', value: '8' },
  { type: 'carburant', value: 'Diesel' },
  { type: 'chiffre_affaires', value: '750000' },
  { type: 'localisation', value: 'Île-de-France' }
];
```

## 📸 **Résultats et Rapports**

### **Screenshots**
- Localisation : `test-results/screenshots/`
- Naming : `01-simulateur-acces.png`, `02-simulation-demarree.png`, etc.

### **Rapport HTML**
- Localisation : `test-results/reports/playwright-report/index.html`
- Contient : Vidéos, traces, logs détaillés

### **Logs Console**
Le test affiche des logs détaillés :
```
[TEST] 🚀 Début du test UX simulateur complet
[TEST] 📍 Étape 1: Accès au simulateur
[SIMULATEUR] ✅ Simulation démarrée avec: button:has-text("Commencer ma simulation")
[TEST] 📍 Étape 3: Réponse aux questions
[SIMULATEUR] 📝 Réponse à la question secteur: Transport
[SIMULATEUR] ✅ Réponse sélectionnée: Transport
```

## 🛠️ **Personnalisation**

### **Modifier les Réponses du Simulateur**
Éditez `tests/schemas/simulateur-ux-complet.spec.ts` :
```typescript
const questionsResponses = [
  { type: 'secteur', value: 'Votre Secteur' },
  { type: 'employes', value: 'Votre Nombre' },
  // ... autres réponses
];
```

### **Ajouter de Nouvelles Questions**
Dans `tests/utils/simulateur-helpers.ts`, ajoutez la détection :
```typescript
if (questionText.includes('votre_mot_cle')) return 'votre_type';
```

### **Modifier les Données d'Inscription**
Dans `tests/utils/simulateur-helpers.ts` :
```typescript
const formFields = [
  { selector: 'votre_selector', value: 'Votre Valeur' },
  // ... autres champs
];
```

## 🔍 **Dépannage**

### **Problèmes Courants**

#### **1. Bouton "Commencer la simulation" non trouvé**
**Solution :** Vérifiez que la page se charge correctement et que le bouton est visible.

#### **2. Questions non détectées**
**Solution :** Ajoutez des mots-clés dans la détection de type de question.

#### **3. Formulaire d'inscription incomplet**
**Solution :** Vérifiez les sélecteurs CSS dans `simulateur-helpers.ts`.

#### **4. Timeout d'attente**
**Solution :** Augmentez les timeouts dans `playwright.config.ts`.

### **Debug Mode**
Pour déboguer, lancez avec `--headed` et `--debug` :
```bash
npx playwright test tests/schemas/simulateur-ux-complet.spec.ts --headed --debug
```

## 📈 **Intégration Continue**

### **GitHub Actions**
Ajoutez dans `.github/workflows/test.yml` :
```yaml
- name: Test UX Simulateur
  run: |
    cd client
    ./scripts/test-ux-rapide.sh
```

### **Pipeline CI/CD**
```bash
# Dans votre pipeline
cd client
npm install
npx playwright install
./scripts/test-ux-rapide.sh
```

## 🎯 **Bonnes Pratiques**

### **1. Tests Réguliers**
- Lancez le test après chaque modification du simulateur
- Vérifiez les screenshots pour détecter les régressions visuelles

### **2. Données de Test**
- Utilisez toujours des données aléatoires pour éviter les conflits
- Documentez les données de test utilisées

### **3. Maintenance**
- Mettez à jour les sélecteurs CSS si l'interface change
- Ajoutez de nouveaux cas de test pour les nouvelles fonctionnalités

### **4. Rapports**
- Consultez régulièrement les rapports HTML
- Archivez les screenshots pour comparaison

## 📞 **Support**

En cas de problème :
1. Vérifiez les logs console
2. Consultez les screenshots d'erreur
3. Vérifiez le rapport HTML
4. Testez manuellement le parcours

---

**🎉 Votre test d'UX simulateur est maintenant opérationnel !** 
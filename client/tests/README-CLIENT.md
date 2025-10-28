# Tests Automatisés - Parcours Client

## 🎯 Description

Suite de tests automatisés complète pour le parcours utilisateur **Client** utilisant Playwright.

## 📋 Pages testées

1. ✅ **Connexion Client** - Authentification avec identifiants
2. ✅ **Dashboard Client** - Vue d'ensemble et KPIs
3. ✅ **Simulateur Client** - Simulation d'éligibilité aux produits
4. ✅ **Agenda Client** - Gestion des rendez-vous
5. ✅ **Messagerie Client** - Communication avec les experts
6. ✅ **Documents Client** - Gestion des documents
7. ✅ **Notifications** - Centre de notifications
8. ✅ **Marketplace Experts** - Recherche et sélection d'experts
9. ✅ **Profil Client** - Informations personnelles
10. ✅ **Paramètres** - Configuration du compte
11. ✅ **Navigation Complète** - Test de navigation entre toutes les pages
12. ✅ **Déconnexion** - Déconnexion et redirection

## 🚀 Configuration

### 1. Installation des dépendances

```bash
cd client
npm install
```

### 2. Configuration des identifiants de test

Créer un fichier `.env.test` à la racine du dossier `client/` :

```bash
# Copier le fichier exemple
cp .env.test.example .env.test
```

Puis éditer `.env.test` avec vos identifiants :

```env
TEST_CLIENT_EMAIL=grandjean.laporte@gmail.com
TEST_CLIENT_PASSWORD=profitum
TEST_URL=https://profitum.app
```

⚠️ **IMPORTANT** : Le fichier `.env.test` est déjà dans `.gitignore` et ne sera jamais commité.

### 3. Installation des navigateurs Playwright

```bash
npm run test:install
```

## 🧪 Exécution des tests

### Tests complets du parcours client

```bash
# Lancer tous les tests client
npm run test client-complete-flow.spec.ts

# Lancer un test spécifique
npm run test client-complete-flow.spec.ts -g "Connexion Client"

# Mode UI interactif (recommandé pour le débogage)
npm run test:ui client-complete-flow.spec.ts

# Mode headed (voir le navigateur)
npm run test:headed client-complete-flow.spec.ts

# Mode debug (pause à chaque étape)
npm run test:debug client-complete-flow.spec.ts
```

### Tests sur des navigateurs spécifiques

```bash
# Chrome uniquement
npm run test client-complete-flow.spec.ts --project=chromium

# Firefox uniquement
npm run test client-complete-flow.spec.ts --project=firefox

# Safari uniquement
npm run test client-complete-flow.spec.ts --project=webkit
```

## 📊 Rapports

### Voir le dernier rapport HTML

```bash
npm run test:report
```

Le rapport HTML interactif s'ouvrira dans votre navigateur avec :
- ✅ Tests réussis
- ❌ Tests échoués
- 📸 Captures d'écran
- 🎥 Vidéos des échecs
- 📈 Statistiques de performance

### Captures d'écran

Les captures d'écran sont automatiquement prises :
- ✅ À chaque étape importante
- ❌ En cas d'échec de test
- 📁 Stockées dans `test-results/screenshots/`

## 🛠️ Helpers disponibles

### ClientHelpers

Classe utilitaire spécifique au parcours client :

```typescript
// Connexion
await helpers.loginAsClient(email, password);

// Navigation
await helpers.navigateToSimulateur();
await helpers.navigateToAgenda();
await helpers.navigateToMessagerie();
await helpers.navigateToDocuments();
await helpers.navigateToNotifications();
await helpers.navigateToMarketplace();
await helpers.navigateToProfil();
await helpers.navigateToSettings();

// Vérifications
await helpers.verifyClientDashboard();
await helpers.verifyClientNavigation();
await helpers.verifyNoErrors();

// Déconnexion
await helpers.logout();
```

## 📝 Structure des fichiers

```
client/tests/
├── client-complete-flow.spec.ts    # Tests du parcours client
├── utils/
│   ├── client-helpers.ts           # Helpers spécifiques client
│   └── test-helpers.ts             # Helpers génériques
├── global-setup.ts                 # Configuration globale
└── README-CLIENT.md                # Cette documentation
```

## 🐛 Débogage

### En cas d'échec de test

1. **Consulter les captures d'écran** dans `test-results/screenshots/`
2. **Voir les vidéos** des échecs dans `test-results/`
3. **Consulter le rapport HTML** avec `npm run test:report`
4. **Lancer en mode UI** avec `npm run test:ui` pour voir le test en temps réel

### Logs détaillés

Les tests affichent des logs détaillés :
- `[CLIENT TEST]` : Actions du test
- `[BROWSER ERROR]` : Erreurs JavaScript du navigateur
- `[PAGE ERROR]` : Erreurs de page

### Mode trace

Pour voir une trace détaillée d'un test :

```bash
# Activer le tracing
npm run test client-complete-flow.spec.ts --trace on

# Puis voir la trace
npx playwright show-trace test-results/.../trace.zip
```

## ✅ Bonnes pratiques

1. **Exécuter les tests régulièrement** après chaque modification importante
2. **Vérifier les rapports** pour identifier les régressions
3. **Mettre à jour les helpers** si de nouvelles fonctionnalités sont ajoutées
4. **Ne jamais commiter** le fichier `.env.test` avec des vrais identifiants
5. **Utiliser le mode UI** pour créer de nouveaux tests interactivement

## 🔒 Sécurité

- ✅ Les identifiants sont dans `.env.test` (ignoré par git)
- ✅ Les tests s'exécutent sur l'environnement de production
- ✅ Aucune donnée sensible dans le code
- ⚠️ Ne jamais partager le fichier `.env.test`

## 📈 Métriques

Chaque test mesure :
- ⏱️ Temps de chargement des pages
- 📸 Captures d'écran à chaque étape
- ❌ Erreurs JavaScript détectées
- 🔄 Navigation entre les pages

## 🆘 Support

En cas de problème :
1. Vérifier que les identifiants dans `.env.test` sont corrects
2. Vérifier que l'URL de production est accessible
3. Consulter les logs et captures d'écran
4. Lancer en mode debug pour identifier le problème précis


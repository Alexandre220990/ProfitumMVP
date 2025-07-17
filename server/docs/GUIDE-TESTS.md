# Guide des Tests - FinancialTracker

## Tests automatisés

### 🧪 Tests unitaires
```bash
npm run test:unit
```
- Tests des composants React
- Tests des services backend
- Tests des utilitaires
- Couverture de code > 80%

### 🔄 Tests d'intégration
```bash
npm run test:integration
```
- Tests API REST
- Tests de base de données
- Tests d'authentification
- Tests de workflow

### 🚀 Tests de performance
```bash
npm run test:performance
```
- Tests de charge
- Tests de stress
- Métriques de performance
- Optimisation continue

## Tests manuels

### ✅ Checklist de validation
- [ ] Authentification utilisateur
- [ ] Création de compte
- [ ] Gestion des profils
- [ ] Upload de documents
- [ ] Génération de rapports
- [ ] Export des données

### 🐛 Tests de régression
- Vérification des fonctionnalités existantes
- Tests de compatibilité navigateur
- Tests de responsive design
- Tests d'accessibilité

## Outils de test

### Frontend
- Jest pour les tests unitaires
- React Testing Library
- Cypress pour les tests E2E
- Storybook pour les composants

### Backend
- Jest pour les tests unitaires
- Supertest pour les tests API
- PostgreSQL pour les tests DB
- Docker pour l'isolation

## Résolution de problèmes

### Erreurs courantes
1. **Timeout des tests** : Augmenter les timeouts
2. **Tests flaky** : Ajouter des retries
3. **Problèmes de DB** : Nettoyer les données de test
4. **Problèmes de cache** : Vider le cache

### Debug des tests
```bash
# Mode debug
npm run test:debug

# Tests spécifiques
npm run test -- --grep "nom du test"

# Couverture détaillée
npm run test:coverage
```

## Bonnes pratiques

### Rédaction des tests
- Tests descriptifs et lisibles
- Un test = une fonctionnalité
- Données de test réalistes
- Nettoyage après chaque test

### Maintenance
- Mise à jour régulière des tests
- Suppression des tests obsolètes
- Documentation des cas de test
- Formation de l'équipe 
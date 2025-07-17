# Guide Analytics Avancées - FinancialTracker

## 📊 Vue d'ensemble

Ce guide présente le système d'analytics avancées intégré à FinancialTracker, offrant des métriques en temps réel, des graphiques interactifs et des fonctionnalités d'export de données.

## 🚀 Fonctionnalités principales

### ✅ Métriques en temps réel
- **KPIs principaux** : Clients, experts, audits, revenus
- **Tendances** : Comparaison avec les périodes précédentes
- **Mise à jour automatique** : Toutes les 30 secondes
- **Indicateurs visuels** : Icônes et couleurs pour les tendances

### ✅ Graphiques interactifs
- **Funnel de conversion** : Suivi des étapes de conversion
- **Performance des produits** : Top produits par revenus
- **Performance des experts** : Classement par efficacité
- **Répartition géographique** : Distribution par ville
- **Métriques temps réel** : Graphiques en ligne

### ✅ Export et rapports
- **Export CSV** : Données structurées
- **Export JSON** : Données complètes
- **Rapports PDF** : Rapports automatisés
- **Filtres avancés** : Périodes personnalisées

## 📁 Structure des fichiers

```
client/src/
├── services/
│   └── analyticsService.ts          # Service principal d'analytics
├── hooks/
│   └── use-analytics.ts             # Hook React pour les analytics
└── components/analytics/
    └── AdvancedAnalyticsDashboard.tsx  # Composant dashboard principal

server/src/routes/
└── analytics.ts                     # Routes API backend

server/scripts/
└── test-analytics.js                # Script de test complet
```

## 🔧 Installation et configuration

### 1. Dépendances requises

```bash
# Frontend - Graphiques
npm install recharts

# Backend - Utilitaires
npm install moment
```

### 2. Configuration des variables d'environnement

```env
# .env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Intégration des routes

Dans `server/src/app.ts` :

```typescript
import analyticsRoutes from './routes/analytics';

// Ajouter les routes analytics
app.use('/api/analytics', analyticsRoutes);
```

## 🎯 Utilisation

### 1. Intégration dans une page

```tsx
import { AdvancedAnalyticsDashboard } from '@/components/analytics/AdvancedAnalyticsDashboard';

function AnalyticsPage() {
  return (
    <div className="container mx-auto p-6">
      <AdvancedAnalyticsDashboard 
        showRealTime={true}
        defaultTimeRange="30d"
      />
    </div>
  );
}
```

### 2. Utilisation du hook personnalisé

```tsx
import { useAnalytics } from '@/hooks/use-analytics';

function CustomAnalytics() {
  const {
    metrics,
    topProducts,
    expertPerformance,
    loading,
    error,
    refresh,
    exportData
  } = useAnalytics({ timeRange: '30d' });

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div>
      {/* Affichage personnalisé */}
    </div>
  );
}
```

### 3. Hooks spécialisés

```tsx
// Métriques principales uniquement
import { useAnalyticsMetrics } from '@/hooks/use-analytics';

// Données de conversion
import { useConversionAnalytics } from '@/hooks/use-analytics';

// Performance des produits
import { useProductAnalytics } from '@/hooks/use-analytics';

// Performance des experts
import { useExpertAnalytics } from '@/hooks/use-analytics';

// Données géographiques
import { useGeographicAnalytics } from '@/hooks/use-analytics';

// Métriques temps réel
import { useRealTimeAnalytics } from '@/hooks/use-analytics';
```

## 📈 API Endpoints

### GET /api/analytics/dashboard
Récupère toutes les données analytics pour le dashboard principal.

**Paramètres :**
- `timeRange` : '7d' | '30d' | '90d' | '1y' | 'custom'
- `startDate` : Date de début (pour custom)
- `endDate` : Date de fin (pour custom)
- `productType` : Type de produit à filtrer
- `expertId` : ID de l'expert à filtrer
- `clientType` : Type de client à filtrer

**Réponse :**
```json
{
  "success": true,
  "data": {
    "metrics": [...],
    "conversionData": [...],
    "timeData": [...],
    "abandonmentPoints": [...],
    "topProducts": [...],
    "expertPerformance": [...],
    "geographicData": [...],
    "realTimeMetrics": [...],
    "funnel": {...}
  }
}
```

### GET /api/analytics/metrics
Récupère uniquement les métriques principales.

### GET /api/analytics/conversion
Récupère les données de conversion et d'abandon.

### GET /api/analytics/products
Récupère les performances des produits.

### GET /api/analytics/experts
Récupère les performances des experts.

### GET /api/analytics/geographic
Récupère les données géographiques.

### GET /api/analytics/realtime
Récupère les métriques en temps réel.

### GET /api/analytics/export
Exporte les données au format CSV ou JSON.

**Paramètres :**
- `format` : 'csv' | 'json'
- `timeRange` : Période à exporter

## 🧪 Tests

### Exécution des tests

```bash
# Test complet des analytics
node server/scripts/test-analytics.js

# Test spécifique (dans le script)
const { testMetrics, testConversionData } = require('./test-analytics.js');
await testMetrics();
await testConversionData();
```

### Tests inclus

1. **Métriques principales** : Vérification des KPIs
2. **Données de conversion** : Test du funnel
3. **Performance des produits** : Analyse des top produits
4. **Performance des experts** : Évaluation des experts
5. **Données géographiques** : Répartition géographique
6. **Métriques temps réel** : Génération de données simulées
7. **Funnel de conversion** : Calcul des taux
8. **Export de données** : Test des formats CSV/JSON

## 🎨 Personnalisation

### 1. Ajout de nouvelles métriques

Dans `analyticsService.ts` :

```typescript
// Ajouter dans getMetrics()
{
  id: 'custom-metric',
  name: 'Métrique personnalisée',
  value: calculateCustomValue(),
  change: calculateChange(),
  changeType: 'increase',
  format: 'number',
  icon: 'custom-icon',
  color: 'text-blue-600',
  trend: 'up'
}
```

### 2. Nouveaux graphiques

Dans `AdvancedAnalyticsDashboard.tsx` :

```tsx
// Ajouter un nouvel onglet
<TabsTrigger value="custom">Nouveau graphique</TabsTrigger>

<TabsContent value="custom" className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle>Nouveau graphique</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        {/* Votre graphique personnalisé */}
      </ResponsiveContainer>
    </CardContent>
  </Card>
</TabsContent>
```

### 3. Filtres personnalisés

```typescript
// Étendre AnalyticsFilters
interface AnalyticsFilters {
  // ... filtres existants
  customFilter?: string;
  category?: string;
  region?: string;
}
```

### 4. Couleurs personnalisées

```typescript
// Modifier les couleurs dans le composant
const CUSTOM_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', 
  '#96CEB4', '#FFEAA7', '#DDA0DD'
];
```

## 🔒 Sécurité et permissions

### Permissions requises

- **Admin** : Accès complet à toutes les analytics
- **Expert** : Accès limité aux analytics pertinentes
- **Client** : Pas d'accès aux analytics (par défaut)

### Middleware d'authentification

```typescript
// Vérification automatique dans les routes
router.get('/dashboard', authenticateUser, requireUserType(['admin', 'expert']), ...)
```

## 📊 Métriques disponibles

### KPIs principaux
- **Total Clients** : Nombre total de clients
- **Nouveaux Clients** : Clients créés dans la période
- **Experts Actifs** : Nombre d'experts actifs
- **Taux de Conversion** : Pourcentage de conversion global
- **Revenus Totaux** : Chiffre d'affaires généré
- **Conversion Revenus** : Taux de conversion des revenus

### Données de conversion
- **Signature charte** : Première étape
- **Sélection expert** : Choix de l'expert
- **Complétion dossier** : Finalisation du dossier
- **Validation admin** : Validation administrative
- **Dossier finalisé** : Dossier terminé

### Performance des produits
- **TICPE** : Taxe Intérieure de Consommation sur les Produits Énergétiques
- **URSSAF** : Recouvrement des cotisations
- **CEE** : Certificats d'Économies d'Énergie
- **DFS** : Déclaration Fiscale Simplifiée
- **Audit Énergétique** : Audits énergétiques

## 🚨 Dépannage

### Problèmes courants

1. **Données non chargées**
   - Vérifier la connexion Supabase
   - Contrôler les permissions utilisateur
   - Vérifier les variables d'environnement

2. **Graphiques non affichés**
   - Installer recharts : `npm install recharts`
   - Vérifier les imports des composants
   - Contrôler les données d'entrée

3. **Export ne fonctionne pas**
   - Vérifier les permissions admin
   - Contrôler le format demandé
   - Vérifier les données disponibles

4. **Temps réel non actif**
   - Activer le monitoring : `enableRealTime()`
   - Vérifier les permissions
   - Contrôler la connexion WebSocket

### Logs de débogage

```typescript
// Activer les logs détaillés
console.log('Analytics data:', data);
console.log('Filters:', filters);
console.log('Error:', error);
```

## 📈 Optimisations

### Performance

1. **Mise en cache** : Cache Redis pour les données fréquentes
2. **Pagination** : Limitation des résultats
3. **Lazy loading** : Chargement à la demande
4. **Compression** : Gzip pour les réponses API

### Base de données

1. **Index** : Index sur les colonnes de date
2. **Vues matérialisées** : Pour les calculs complexes
3. **Partitioning** : Partitionnement par date
4. **Optimisation des requêtes** : Requêtes optimisées

## 🔄 Maintenance

### Tâches régulières

1. **Nettoyage des données** : Suppression des anciennes métriques
2. **Optimisation des index** : Maintenance des index
3. **Mise à jour des métriques** : Calcul des tendances
4. **Sauvegarde** : Sauvegarde des données analytics

### Monitoring

```bash
# Vérifier l'état des analytics
curl -X GET "http://localhost:3000/api/analytics/metrics"

# Tester l'export
curl -X GET "http://localhost:3000/api/analytics/export?format=csv"
```

## 📚 Ressources additionnelles

- **Documentation Recharts** : https://recharts.org/
- **Guide Supabase** : https://supabase.com/docs
- **TypeScript** : https://www.typescriptlang.org/docs/
- **React Hooks** : https://react.dev/reference/react/hooks

## 🤝 Contribution

Pour contribuer aux analytics :

1. **Fork** le projet
2. **Créer** une branche feature
3. **Implémenter** les améliorations
4. **Tester** avec le script de test
5. **Documenter** les changements
6. **Soumettre** une pull request

## 📞 Support

Pour toute question ou problème :

1. **Vérifier** ce guide
2. **Consulter** les logs d'erreur
3. **Tester** avec le script de test
4. **Ouvrir** une issue sur GitHub

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2024  
**Auteur** : Équipe FinancialTracker 
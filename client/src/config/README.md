# Configuration de l'Application

## Vue d'ensemble

Le système de configuration de l'application FinancialTracker est centralisé dans le fichier `env.ts`. Cette approche offre plusieurs avantages :

- **Centralisation** : Toutes les variables d'environnement sont gérées à un seul endroit
- **Validation** : Vérification automatique de la configuration au démarrage
- **Type Safety** : Interface TypeScript pour une meilleure sécurité des types
- **Flexibilité** : Support des environnements de développement et production

## Structure

### Fichiers de configuration

- `env.ts` : Configuration principale avec validation
- `config.ts` : Export de compatibilité (déprécié)
- `env.example` : Exemple de variables d'environnement

### Interface AppConfig

```typescript
interface AppConfig {
  // Configuration API
  API_URL: string;
  
  // Configuration Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  
  // Configuration environnement
  NODE_ENV: 'development' | 'production' | 'test';
  IS_DEVELOPMENT: boolean;
  IS_PRODUCTION: boolean;
  
  // Configuration analytics
  GOOGLE_ANALYTICS_ID?: string;
  MIXPANEL_TOKEN?: string;
  
  // Configuration features
  ENABLE_CHATBOT: boolean;
  ENABLE_ANALYTICS: boolean;
  ENABLE_NOTIFICATIONS: boolean;
  
  // Configuration réseau
  USE_IPV6: boolean;
  API_TIMEOUT: number;
  
  // Configuration sécurité
  SESSION_DURATION: number;
  MAX_RETRY_ATTEMPTS: number;
  RETRY_DELAY: number;
}
```

## Utilisation

### Import de base

```typescript
import { config } from '@/config/env';

// Utilisation directe
const apiUrl = config.API_URL;
const isDev = config.IS_DEVELOPMENT;
```

### Fonctions utilitaires

```typescript
import { getApiUrl, isFeatureEnabled } from '@/config/env';

// URL API avec support IPv6
const apiUrl = getApiUrl();

// Vérification des features
if (isFeatureEnabled('ENABLE_CHATBOT')) {
  // Initialiser le chatbot
}
```

### Validation automatique

La configuration est automatiquement validée au chargement du module :

- ✅ Variables critiques présentes
- ✅ URLs valides
- ⚠️ Avertissements pour les variables optionnelles
- ❌ Erreurs en production si configuration invalide

## Variables d'environnement

### Variables requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | URL du projet Supabase | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase | `eyJhbGciOiJIUzI1NiIs...` |
| `VITE_API_URL` | URL de l'API backend | `https://www.profitum.app` |

### Variables optionnelles

| Variable | Description | Défaut |
|----------|-------------|--------|
| `VITE_USE_IPV6` | Utiliser IPv6 en dev | `false` |
| `VITE_API_TIMEOUT` | Timeout API (ms) | `30000` |
| `VITE_ENABLE_CHATBOT` | Activer le chatbot | `true` |
| `VITE_ENABLE_ANALYTICS` | Activer les analytics | `true` |
| `VITE_ENABLE_NOTIFICATIONS` | Activer les notifications | `true` |
| `VITE_SESSION_DURATION` | Durée session (ms) | `86400000` |
| `VITE_MAX_RETRY_ATTEMPTS` | Tentatives reconnexion | `3` |
| `VITE_RETRY_DELAY` | Délai entre tentatives (ms) | `1000` |

## Migration depuis l'ancien système

### Avant (déprécié)

```typescript
import { API_URL } from '@/config';
const apiUrl = API_URL;
```

### Après (recommandé)

```typescript
import { config } from '@/config/env';
const apiUrl = config.API_URL;
```

## Bonnes pratiques

1. **Toujours utiliser `config` depuis `@/config/env`**
2. **Ne pas accéder directement aux variables d'environnement**
3. **Utiliser les fonctions utilitaires pour la logique métier**
4. **Tester la configuration en développement**
5. **Documenter les nouvelles variables d'environnement**

## Dépannage

### Erreurs courantes

1. **Variables manquantes** : Vérifiez le fichier `.env.local`
2. **URLs invalides** : Assurez-vous que les URLs sont correctes
3. **TypeScript errors** : Vérifiez l'interface `AppConfig`

### Logs de validation

La validation affiche des messages dans la console :

- ✅ Configuration validée avec succès
- ⚠️ Variables optionnelles manquantes
- ❌ Erreurs de configuration critiques 
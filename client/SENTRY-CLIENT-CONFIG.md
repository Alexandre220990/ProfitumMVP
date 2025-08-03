# 🎯 Configuration Sentry Client - Complète

## 🔧 **Fichier .env Client avec Sentry**

```bash
# ============================================================================
# CONFIGURATION CLIENT - PROFITUMV2 (PRODUCTION)
# ============================================================================

# Configuration Supabase (sécurisé - clés publiques)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Configuration API (production)
VITE_API_URL=https://your-api-domain.com
VITE_SOCKET_URL=https://your-socket-domain.com

# Configuration App
VITE_APP_URL=https://your-app-domain.com

# ============================================================================
# CONFIGURATION SENTRY (MONITORING ET ERREURS)
# ============================================================================

# DSN Sentry pour le client (capture les erreurs frontend)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Configuration Sentry
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_PROFILES_SAMPLE_RATE=0.1

# Token de sécurité Sentry
VITE_SENTRY_TOKEN=your-sentry-token-here
VITE_SENTRY_TOKEN_HEADER=X-Sentry-Token

# Domaines autorisés pour Sentry
VITE_SENTRY_ALLOWED_DOMAINS=https://your-domain.com,https://*.your-domain.com,https://localhost:3000,http://localhost:3000

# ============================================================================
# CONFIGURATION GOOGLE CALENDAR (sécurisé - Client ID public)
# ============================================================================

VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback

# ============================================================================
# CONFIGURATION FEATURE FLAGS
# ============================================================================

VITE_GOOGLE_CALENDAR_ENABLED=true
VITE_COLLABORATIVE_EVENTS_ENABLED=true
VITE_NOTIFICATIONS_ENABLED=true

# ============================================================================
# CONFIGURATION ANALYTICS
# ============================================================================

VITE_ANALYTICS_ENABLED=true

# ============================================================================
# CONFIGURATION SENTRY FEATURES
# ============================================================================

# Activer le monitoring Sentry
VITE_SENTRY_ENABLED=true

# Activer la capture d'erreurs automatique
VITE_SENTRY_AUTO_CAPTURE=true

# Activer le monitoring des performances
VITE_SENTRY_PERFORMANCE_MONITORING=true

# Activer la capture des actions utilisateur
VITE_SENTRY_USER_ACTIONS=true

# Activer la capture des métriques business
VITE_SENTRY_BUSINESS_METRICS=true
```

---

## 🚀 **Configuration Sentry dans le Client**

### **1️⃣ Installation Sentry Client**

```bash
cd client
npm install @sentry/react @sentry/tracing
```

### **2️⃣ Configuration dans main.tsx**

```typescript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

// Initialiser Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
  
  // Configuration de performance
  tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  profilesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
  
  // Intégrations
  integrations: [
    new BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        history => history.listen
      ),
    }),
  ],
  
  // Configuration de sécurité
  sendDefaultPii: true,
  
  // Filtrage des erreurs
  beforeSend(event) {
    // Ignorer les erreurs de développement
    if (import.meta.env.DEV && event.level === 'info') {
      return null;
    }
    
    // Ajouter des tags globaux
    event.tags = {
      ...event.tags,
      service: 'profitum-client',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    };
    
    return event;
  },
  
  // Capture des contextes
  beforeBreadcrumb(breadcrumb) {
    breadcrumb.data = {
      ...breadcrumb.data,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
    };
    
    return breadcrumb;
  },
});

// Wrapper Sentry pour l'app React
const SentryApp = Sentry.withProfiler(App);
```

### **3️⃣ Configuration dans App.tsx**

```typescript
import * as Sentry from "@sentry/react";

// Wrapper pour capturer les erreurs React
export default Sentry.withErrorBoundary(App, {
  fallback: ({ error, componentStack, resetError }) => (
    <div className="error-boundary">
      <h2>Une erreur s'est produite</h2>
      <p>{error.message}</p>
      <button onClick={resetError}>Réessayer</button>
    </div>
  ),
});
```

---

## 🎯 **Utilisation dans les Composants**

### **1️⃣ Capture d'erreurs manuelle**

```typescript
import * as Sentry from "@sentry/react";

// Dans vos composants
try {
  // Votre code
  await someRiskyOperation();
} catch (error) {
  // Capture avec contexte
  Sentry.captureException(error, {
    tags: { component: 'UserProfile', action: 'update' },
    extra: { userId, formData }
  });
}
```

### **2️⃣ Capture d'actions utilisateur**

```typescript
import * as Sentry from "@sentry/react";

// Capturer les actions utilisateur
const handleUserAction = (action: string, data?: any) => {
  Sentry.addBreadcrumb({
    message: `Action utilisateur: ${action}`,
    category: 'user_action',
    level: 'info',
    data: { action, data, timestamp: new Date().toISOString() }
  });
};

// Utilisation
handleUserAction('button_click', { buttonId: 'submit-form' });
```

### **3️⃣ Métriques de performance**

```typescript
import * as Sentry from "@sentry/react";

// Mesurer les performances
const measurePerformance = (operation: string) => {
  const transaction = Sentry.startTransaction({
    name: operation,
    op: 'ui.interaction'
  });
  
  return {
    finish: () => transaction.finish()
  };
};

// Utilisation
const perf = measurePerformance('form_submission');
try {
  await submitForm();
} finally {
  perf.finish();
}
```

---

## 📊 **Configuration Dashboard Sentry**

### **Tags automatiques :**
- `service: profitum-client`
- `environment: production|development`
- `version: 1.0.0`
- `component: UserProfile|Dashboard|etc.`
- `action: click|submit|navigate`

### **Métriques à surveiller :**
1. **Error Rate** : < 1%
2. **Performance** : Temps de chargement des pages
3. **User Actions** : Actions utilisateur
4. **Navigation** : Routes visitées

---

## 🔍 **Test de la Configuration**

### **1️⃣ Test d'erreur**

```typescript
// Dans un composant
const testError = () => {
  throw new Error("Test erreur Sentry client");
};

// Bouton de test
<button onClick={testError}>Test Sentry</button>
```

### **2️⃣ Test de performance**

```typescript
// Mesurer le temps de chargement
const measurePageLoad = () => {
  const transaction = Sentry.startTransaction({
    name: 'page_load',
    op: 'pageload'
  });
  
  window.addEventListener('load', () => {
    transaction.finish();
  });
};
```

---

## 🎉 **Résultat Final**

Avec cette configuration, votre client capture :
- ✅ **Erreurs JavaScript** (erreurs React, exceptions)
- ✅ **Performance** (temps de chargement, interactions)
- ✅ **Actions utilisateur** (clics, navigation, formulaires)
- ✅ **Métriques business** (conversions, engagement)
- ✅ **Contexte complet** (utilisateur, environnement, version)

**Votre application client est maintenant entièrement monitorée !** 🚀 
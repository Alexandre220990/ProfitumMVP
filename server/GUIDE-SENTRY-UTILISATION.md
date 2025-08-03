# 🎯 Guide d'Utilisation Sentry - Pratique

## 🚀 **Sentry est maintenant généralisé à tout votre code !**

### **📋 Ce qui a été configuré :**

1. ✅ **Configuration globale** : `src/config/sentry.ts`
2. ✅ **Initialisation automatique** : Dans `src/index.ts`
3. ✅ **Middleware Express** : Capture automatique des requêtes/erreurs
4. ✅ **Utilitaires** : `src/utils/sentry-utils.ts`
5. ✅ **Service notifications** : Intégré avec Sentry

## 🎮 **Comment utiliser Sentry dans votre code :**

### **1️⃣ Dans les Routes Express**

```typescript
import { withSentryRoute, captureUserAction } from '../utils/sentry-utils';

// Route avec Sentry automatique
router.get('/clients/:id', withSentryRoute(async (req, res) => {
  const clientId = req.params.id;
  
  // Capturer l'action utilisateur
  captureUserAction(
    req.user?.id || 'anonymous',
    req.user?.type || 'unknown',
    'view_client',
    { clientId }
  );
  
  const client = await getClient(clientId);
  res.json(client);
}, {
  operation: 'get_client',
  tags: { module: 'clients' }
}));
```

### **2️⃣ Dans les Services**

```typescript
import { withSentryService, captureBusinessEvent } from '../utils/sentry-utils';

// Service avec Sentry automatique
const createClient = withSentryService(
  async (clientData: any) => {
    const client = await supabase
      .from('Client')
      .insert(clientData)
      .select()
      .single();
    
    // Capturer l'événement métier
    captureBusinessEvent('client_created', {
      clientId: client.id,
      clientName: client.name
    }, {
      module: 'clients',
      action: 'create'
    });
    
    return client;
  },
  'ClientService',
  'createClient'
);
```

### **3️⃣ Capture d'Erreurs Manuelle**

```typescript
import { captureError, captureMessage } from '../config/sentry';

try {
  // Votre code
  await someRiskyOperation();
} catch (error) {
  // Capture automatique avec contexte
  captureError(error, {
    user: { id: userId, type: 'client' },
    tags: { operation: 'risky_operation' },
    extra: { userId, operationData }
  });
  
  throw error; // Re-lancer l'erreur
}
```

### **4️⃣ Métriques de Performance**

```typescript
import { capturePerformanceMetric } from '../utils/sentry-utils';

const startTime = Date.now();

// Votre opération
await heavyOperation();

const duration = Date.now() - startTime;

// Capturer la métrique
capturePerformanceMetric('heavy_operation', duration, {
  operation: 'data_processing',
  records: recordCount
});
```

### **5️⃣ Événements Métier**

```typescript
import { captureBusinessEvent } from '../utils/sentry-utils';

// Quand un expert est assigné
captureBusinessEvent('expert_assigned', {
  expertId: expert.id,
  clientId: client.id,
  projectId: project.id
}, {
  module: 'assignments',
  priority: 'high'
});

// Quand un document est validé
captureBusinessEvent('document_validated', {
  documentId: document.id,
  validatorId: validator.id,
  documentType: document.type
}, {
  module: 'documents',
  action: 'validation'
});
```

## 📊 **Ce que vous verrez dans Sentry :**

### **🔍 Dashboard Principal**
```
┌─────────────────────────────────────┐
│ 📊 Issues (Erreurs)                 │
│ ├── Erreurs par module              │
│ ├── Erreurs par utilisateur         │
│ └── Erreurs par opération           │
├─────────────────────────────────────┤
│ 📈 Performance                      │
│ ├── Temps de réponse par route      │
│ ├── Métriques personnalisées        │
│ └── Goulots d'étranglement          │
├─────────────────────────────────────┤
│ 🎯 Événements Métier                │
│ ├── Actions utilisateur             │
│ ├── Événements système              │
│ └── Métriques business              │
└─────────────────────────────────────┘
```

### **📋 Exemples de Tags/Contextes**

**Erreurs :**
- `service: profitum-server`
- `module: clients|experts|admins|notifications`
- `operation: create|update|delete|view`
- `userType: client|expert|admin`
- `statusCode: 400|500|404`

**Performance :**
- `type: performance`
- `operation: heavy_operation`
- `duration: 1500ms`
- `records: 1000`

**Événements Métier :**
- `type: business_event`
- `event: client_created|expert_assigned|document_validated`
- `module: clients|assignments|documents`

## 🚨 **Alertes Automatiques**

### **Configuration d'Alertes Sentry :**

1. **Aller** dans votre projet Sentry
2. **Settings** → **Alerts**
3. **Create Alert Rule**

### **Exemples d'Alertes :**

```yaml
# Erreur critique
Condition: Error rate > 5% (5 minutes)
Action: Email + Slack notification

# Performance dégradée
Condition: Response time > 2s (5 minutes)
Action: Email notification

# Nouveau type d'erreur
Condition: New error type detected
Action: Slack notification

# Métrique business
Condition: No client_created events (1 hour)
Action: Email notification
```

## 🎯 **Bonnes Pratiques**

### **✅ À Faire :**

```typescript
// ✅ Capture avec contexte riche
captureError(error, {
  user: { id: userId, type: userType },
  tags: { module: 'clients', operation: 'create' },
  extra: { clientData, validationErrors }
});

// ✅ Événements métier significatifs
captureBusinessEvent('payment_processed', {
  amount: 5000,
  currency: 'EUR',
  paymentMethod: 'card'
});

// ✅ Métriques de performance
capturePerformanceMetric('database_query', duration, {
  table: 'clients',
  operation: 'select'
});
```

### **❌ À Éviter :**

```typescript
// ❌ Capture sans contexte
captureError(error);

// ❌ Trop d'événements non significatifs
captureMessage('User clicked button');

// ❌ Données sensibles
captureError(error, {
  extra: { password: 'secret123' } // ❌
});
```

## 🔧 **Configuration Avancée**

### **Variables d'Environnement :**

```bash
# .env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
NODE_ENV=production
APP_VERSION=1.0.0
```

### **Filtrage d'Erreurs :**

```typescript
// Dans src/config/sentry.ts
beforeSend(event) {
  // Ignorer les erreurs de développement
  if (process.env.NODE_ENV === 'development' && event.level === 'info') {
    return null;
  }
  
  // Ignorer les erreurs 404
  if (event.tags?.statusCode === '404') {
    return null;
  }
  
  return event;
}
```

## 📱 **Dashboard Sentry - Navigation**

### **Page d'Accueil :**
- 📊 **Issues** : Erreurs en cours
- 📈 **Performance** : Temps de réponse
- 🎯 **Releases** : Versions déployées
- 👥 **Team** : Activité équipe

### **Détail d'une Erreur :**
- 🔍 **Stack Trace** : Ligne par ligne
- 📋 **Context** : Variables, utilisateur
- 📊 **Occurrences** : Fréquence
- 👥 **Assignation** : Responsable

### **Métriques :**
- ⏱️ **Response Time** : Temps de réponse
- 📊 **Throughput** : Débit
- 🔄 **Error Rate** : Taux d'erreur
- 📈 **Trends** : Évolutions

---

## 🎉 **Résultat Final :**

Votre application capture maintenant automatiquement :
- ✅ **Toutes les erreurs** (avec contexte complet)
- ✅ **Performance** (temps de réponse, métriques)
- ✅ **Événements métier** (actions utilisateur, business)
- ✅ **Requêtes HTTP** (routes, paramètres, réponses)
- ✅ **Erreurs non gérées** (uncaught exceptions)

**Sentry vous donne une vue complète de la santé de votre application !** 🚀 
# 🎯 Configuration Sentry - Finale

## ✅ **Sentry est maintenant configuré selon les standards officiels !**

### **📋 Ce qui a été fait :**

1. ✅ **Fichier instrument.ts** : Initialisation Sentry au démarrage
2. ✅ **Import au top** : `import "./instrument"` dans index.ts
3. ✅ **Middleware Express** : `Sentry.setupExpressErrorHandler(app)`
4. ✅ **Route de test** : `/debug-sentry` pour vérifier
5. ✅ **Fallback handler** : Gestion d'erreur Sentry

## 🔧 **Configuration finale requise :**

### **1️⃣ Ajouter le DSN dans votre .env**

```bash
# Dans votre fichier .env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### **2️⃣ Test de la configuration**

```bash
# Démarrer le serveur
npm run dev

# Tester Sentry (dans un navigateur ou avec curl)
curl http://localhost:5001/debug-sentry
```

**Résultat attendu :** Une erreur 500 et l'erreur apparaît dans votre dashboard Sentry !

## 📊 **Ce que vous verrez dans Sentry :**

### **🔍 Dashboard Principal**
```
┌─────────────────────────────────────┐
│ 📊 Issues (Erreurs)                 │
│ ├── "My first Sentry error!"        │
│ ├── Erreurs par module              │
│ └── Erreurs par utilisateur         │
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

### **📋 Tags automatiques**
- `service: profitum-server`
- `environment: development|production`
- `version: 1.0.0`
- `method: GET|POST|PUT|DELETE`
- `path: /api/...`
- `statusCode: 200|400|500`

## 🚨 **Alertes recommandées**

### **Configuration d'Alertes :**

1. **Aller** dans votre projet Sentry
2. **Settings** → **Alerts**
3. **Create Alert Rule**

### **Alertes essentielles :**

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
```

## 🎮 **Utilisation dans votre code :**

### **Capture d'erreurs automatique :**
```typescript
// Toutes les erreurs sont automatiquement capturées !
try {
  await someRiskyOperation();
} catch (error) {
  // Sentry capture automatiquement
  throw error;
}
```

### **Capture manuelle :**
```typescript
import * as Sentry from "@sentry/node";

// Capture avec contexte
Sentry.captureException(error, {
  tags: { module: 'clients', operation: 'create' },
  extra: { userId, clientData }
});

// Capture de message
Sentry.captureMessage("Action utilisateur", {
  level: 'info',
  tags: { action: 'user_login' }
});
```

### **Définir l'utilisateur :**
```typescript
Sentry.setUser({
  id: userId,
  userType: 'client|expert|admin'
});
```

## 🔍 **Vérification de la configuration :**

### **1️⃣ Test rapide :**
```bash
# Démarrer le serveur
npm run dev

# Tester l'erreur Sentry
curl http://localhost:5001/debug-sentry
```

### **2️⃣ Vérifier dans Sentry :**
- Aller sur votre dashboard Sentry
- Vérifier que l'erreur "My first Sentry error!" apparaît
- Vérifier les tags et le contexte

### **3️⃣ Test avec une vraie erreur :**
```typescript
// Dans n'importe quelle route
app.get('/test-error', (req, res) => {
  throw new Error('Test erreur réelle');
});
```

## 🎉 **Résultat Final :**

Votre application capture maintenant automatiquement :
- ✅ **Toutes les erreurs** (avec stack trace complète)
- ✅ **Performance** (temps de réponse, métriques)
- ✅ **Requêtes HTTP** (routes, paramètres, réponses)
- ✅ **Erreurs non gérées** (uncaught exceptions)
- ✅ **Contexte utilisateur** (ID, type, actions)

**Sentry vous donne une vue complète de la santé de votre application !** 🚀

---

## 📞 **Support**

Si vous avez des questions ou des problèmes :
1. Vérifiez les logs du serveur
2. Consultez le dashboard Sentry
3. Testez avec la route `/debug-sentry`

**Votre application est maintenant entièrement monitorée !** 🎯 
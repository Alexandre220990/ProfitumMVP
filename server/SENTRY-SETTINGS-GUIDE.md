# 🎯 Configuration Sentry - Paramètres Recommandés

## 📧 **Email Settings**

### **Subject Prefix**
```
[Profitum] 
```
**Pourquoi :** Identifie immédiatement les emails comme venant de votre projet

### **Spike Protection**
✅ **Activer** - Recommandé pour éviter le spam d'erreurs

---

## 🔒 **Client Security**

### **Allowed Domains**
```
https://profitum.fr
https://*.profitum.fr
https://localhost:5001
https://localhost:3000
http://localhost:5001
http://localhost:3000
```

**Pourquoi :** Sécurise votre projet en limitant les domaines autorisés

### **Enable JavaScript source fetching**
✅ **Activer** - Pour avoir le contexte complet des erreurs

### **Security Token**
```
your-sentry-token-here
```
**Token Header :** `X-Sentry-Token`

### **Verify TLS/SSL**
✅ **Activer** - Pour la sécurité des communications

---

## ⚙️ **Event Settings**

### **Auto Resolve**
```
30 days
```
**Pourquoi :** Nettoie automatiquement les anciennes erreurs résolues

---

## 🚨 **Alertes Recommandées**

### **1. Erreur Critique**
```
Condition: Error rate > 5% (5 minutes)
Action: Email + Slack
```

### **2. Performance Dégradée**
```
Condition: Response time > 2s (5 minutes)
Action: Email
```

### **3. Nouveau Type d'Erreur**
```
Condition: New error type detected
Action: Slack
```

### **4. Métrique Business**
```
Condition: No client_created events (1 hour)
Action: Email
```

---

## 📊 **Tags Personnalisés**

### **Ajouter dans votre code :**
```typescript
Sentry.setTag('environment', process.env.NODE_ENV);
Sentry.setTag('version', process.env.APP_VERSION);
Sentry.setTag('service', 'profitum-server');
Sentry.setTag('userType', 'client|expert|admin');
```

---

## 🔧 **Configuration Avancée**

### **Filtrage d'Erreurs**
```typescript
// Dans instrument.ts
beforeSend(event) {
  // Ignorer les erreurs 404
  if (event.tags?.statusCode === '404') {
    return null;
  }
  
  // Ignorer les erreurs de développement
  if (process.env.NODE_ENV === 'development' && event.level === 'info') {
    return null;
  }
  
  return event;
}
```

### **Quiet Hours**
```typescript
// Ignorer les notifications entre 22h et 8h
const quietHours = {
  start: '22:00',
  end: '08:00',
  timezone: 'Europe/Paris'
};
```

---

## 📱 **Dashboard Configuration**

### **Vues Personnalisées**
1. **Erreurs par Module**
   - Filter: `module:clients|experts|admins|notifications`

2. **Performance par Route**
   - Filter: `type:performance`

3. **Actions Utilisateur**
   - Filter: `type:user_action`

4. **Événements Métier**
   - Filter: `type:business_event`

---

## 🎯 **Paramètres de Production**

### **Variables d'Environnement**
```bash
# .env.production
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NODE_ENV=production
APP_VERSION=1.0.0
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### **Configuration de Performance**
```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
```

---

## 🔍 **Monitoring Recommandé**

### **Métriques à Surveiller**
1. **Error Rate** : < 1%
2. **Response Time** : < 2s
3. **Throughput** : Par minute
4. **User Satisfaction** : Via breadcrumbs

### **Alertes Critiques**
1. **Service Down** : 0 events in 5 minutes
2. **High Error Rate** : > 10% errors
3. **Performance Degradation** : > 5s response time

---

## 📞 **Support et Maintenance**

### **Équipe Sentry**
- **Admin** : Vous
- **Developers** : Votre équipe
- **Viewers** : Stakeholders

### **Maintenance Mensuelle**
1. **Nettoyer les anciennes erreurs**
2. **Vérifier les alertes**
3. **Analyser les performances**
4. **Mettre à jour les filtres**

---

## 🎉 **Résultat Final**

Avec cette configuration, vous aurez :
- ✅ **Sécurité maximale** (domaines autorisés, TLS)
- ✅ **Alertes intelligentes** (spike protection, auto-resolve)
- ✅ **Monitoring complet** (erreurs, performance, métriques)
- ✅ **Filtrage optimisé** (évite le bruit)
- ✅ **Dashboard personnalisé** (vues métier)

**Votre projet Profitum est maintenant parfaitement monitoré !** 🚀 